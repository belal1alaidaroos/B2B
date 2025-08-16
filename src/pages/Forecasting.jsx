import React, { useState, useEffect, useMemo } from 'react';
import { Opportunity } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent from '@/components/common/ProtectedComponent';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, Target, CheckCircle, PieChart as PieChartIcon, AlertTriangle 
} from 'lucide-react';
import { startOfQuarter, endOfQuarter, addQuarters, isWithinInterval, parseISO } from 'date-fns';

const settingsCache = {};

const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
};

export default function ForecastingPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [quota, setQuota] = useState(0);
  const [currency, setCurrency] = useState('AED');
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('this_quarter');
  const { canRead } = usePermissions();

  useEffect(() => {
    if (canRead('forecasting')) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [canRead]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [oppsData, settingsData] = await Promise.all([
        Opportunity.list(),
        settingsCache.data ? Promise.resolve(settingsCache.data) : SystemSetting.list()
      ]);
      
      if (!settingsCache.data) {
          settingsCache.data = settingsData;
      }

      setOpportunities(oppsData);

      const quotaSetting = settingsCache.data.find(s => s.key === 'quarterly_sales_quota');
      if (quotaSetting) setQuota(parseFloat(quotaSetting.value));
      
      const currencySetting = settingsCache.data.find(s => s.key === 'default_currency');
      if (currencySetting) setCurrency(currencySetting.value);

    } catch (error) {
      console.error("Error loading forecasting data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const forecastMetrics = useMemo(() => {
    const now = new Date();
    const periodStart = startOfQuarter(timePeriod === 'next_quarter' ? addQuarters(now, 1) : now);
    const periodEnd = endOfQuarter(timePeriod === 'next_quarter' ? addQuarters(now, 1) : now);

    const relevantOpps = opportunities.filter(opp => {
      const closeDate = opp.expected_close_date ? parseISO(opp.expected_close_date) : null;
      return closeDate && isWithinInterval(closeDate, { start: periodStart, end: periodEnd });
    });

    const wonAmount = relevantOpps
      .filter(o => o.stage === 'closed_won')
      .reduce((sum, o) => sum + (o.amount || 0), 0);
      
    const openOpps = relevantOpps.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost');

    const weightedForecast = openOpps.reduce((sum, o) => sum + (o.amount * (o.probability / 100)), 0);
    const totalPipeline = openOpps.reduce((sum, o) => sum + o.amount, 0);
    
    const quotaAttainment = quota > 0 ? (wonAmount / quota) * 100 : 0;
    const remainingQuota = Math.max(0, quota - wonAmount);
    const forecastCoverage = remainingQuota > 0 ? (weightedForecast / remainingQuota) * 100 : 0;
    
    const breakdownByStage = pipelineStages.map(stage => {
        const stageOpps = openOpps.filter(o => o.stage === stage.id);
        return {
            name: stage.title,
            weightedValue: stageOpps.reduce((sum, o) => sum + (o.amount * (o.probability / 100)), 0),
            pipelineValue: stageOpps.reduce((sum, o) => sum + o.amount, 0),
            count: stageOpps.length
        };
    }).filter(s => s.count > 0);

    return {
      wonAmount,
      weightedForecast,
      totalPipeline,
      quotaAttainment,
      forecastCoverage,
      chartData: [{
        name: 'Forecast',
        won: wonAmount,
        forecast: weightedForecast
      }],
      breakdownByStage
    };
  }, [opportunities, quota, timePeriod]);

  if (!canRead('forecasting')) {
    return (
      <ProtectedComponent module="forecasting" action="read">
        <div className="p-4">Access Denied</div>
      </ProtectedComponent>
    );
  }

  if (isLoading) {
      return (
          <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
              <Skeleton className="h-96 rounded-xl" />
          </div>
      );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              Sales Forecasting
            </h1>
            <p className="text-sm text-gray-600 mt-1">Analyze your pipeline and predict sales performance against your goals.</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px] clay-element border-none">
                <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="next_quarter">Next Quarter</SelectItem>
            </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ForecastCard title="Quarterly Quota" value={formatCurrency(quota, currency)} icon={Target} color="gray" />
          <ForecastCard title="Closed Won" value={formatCurrency(forecastMetrics.wonAmount, currency)} icon={CheckCircle} color="green">
              <p className="text-xs text-gray-500 mt-1">
                  {forecastMetrics.quotaAttainment.toFixed(1)}% of quota
              </p>
          </ForecastCard>
          <ForecastCard title="Weighted Forecast" value={formatCurrency(forecastMetrics.weightedForecast, currency)} icon={PieChartIcon} color="blue">
               <p className="text-xs text-gray-500 mt-1">
                  From {forecastMetrics.breakdownByStage.reduce((sum, s) => sum + s.count, 0)} open deals
              </p>
          </ForecastCard>
          <ForecastCard title="Pipeline Coverage" value={`${forecastMetrics.forecastCoverage.toFixed(0)}%`} icon={AlertTriangle} color="orange" description="How much of your remaining quota is covered by your weighted forecast." />
      </div>

      <Card className="clay-card">
          <CardHeader>
              <CardTitle>Quota Attainment Progress</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={forecastMetrics.chartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(val) => formatCurrency(val, currency)} />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                      <Legend />
                      <ReferenceLine x={quota} stroke="#172554" strokeDasharray="4 4">
                        <Legend payload={[{ value: 'Quota', type: 'line', color: '#172554' }]} />
                      </ReferenceLine>
                      <Bar dataKey="won" name="Closed Won" stackId="a" fill="#16a34a" />
                      <Bar dataKey="forecast" name="Weighted Forecast" stackId="a" fill="#3b82f6" />
                  </BarChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>
      
      <Card className="clay-card">
          <CardHeader>
              <CardTitle>Forecast by Stage</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {forecastMetrics.breakdownByStage.map(stage => (
                      <div key={stage.name}>
                          <div className="flex justify-between items-center mb-1 text-sm">
                              <span className="font-medium text-gray-700">{stage.name} ({stage.count})</span>
                              <span className="font-semibold text-gray-800">{formatCurrency(stage.weightedValue, currency)}</span>
                          </div>
                          <Progress value={(stage.weightedValue / forecastMetrics.totalPipeline) * 100} className="h-2" />
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>

    </div>
  );
}

const ForecastCard = ({ title, value, icon: Icon, color, children, description }) => {
    const colors = {
        gray: 'text-gray-600 bg-gray-100',
        green: 'text-green-600 bg-green-100',
        blue: 'text-blue-600 bg-blue-100',
        orange: 'text-orange-600 bg-orange-100'
    };
    return (
        <Card className="clay-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <Icon className={`w-5 h-5 ${colors[color]}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {children}
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
};

// Define pipeline stages to be used in breakdown, matching opportunity entity
const pipelineStages = [
  { id: 'qualification', title: 'Qualification' },
  { id: 'needs_analysis', title: 'Needs Analysis' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
];