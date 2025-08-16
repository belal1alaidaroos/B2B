import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, BarChart2, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formatCurrency = (value, currency = 'AED') => {
    const currencySymbols = {
        'AED': 'د.إ', 'SAR': 'ر.س', 'USD': '$', 'EUR': '€', 'GBP': '£'
    };
    const symbol = currencySymbols[currency] || currency;
    return `${new Intl.NumberFormat('en-US').format(value || 0)} ${symbol}`;
};

const groupComponentsByType = (components) => {
    return components.reduce((acc, comp) => {
        const type = comp.type || 'other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(comp);
        return acc;
    }, {});
};

export default function CostBreakdown({ calculation, quantity, currency, vatRate }) {
    const { 
        cost_breakdown, 
        total_monthly_cost, 
        total_one_time_cost, 
        subtotal, 
        tax_amount, 
        total_amount,
        base_job_cost,
        applied_rules
    } = calculation;

    const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);

    const monthlyComponents = cost_breakdown.filter(c => c.periodicity === 'monthly');
    const oneTimeComponents = cost_breakdown.filter(c => c.periodicity !== 'monthly');

    const groupedMonthly = groupComponentsByType(monthlyComponents);
    const groupedOneTime = groupComponentsByType(oneTimeComponents);

    const CalculationResult = ({ label, value, highlight = false, className = '' }) => (
        <div className={`flex justify-between items-center text-sm py-1.5 ${highlight ? 'font-bold' : ''} ${className}`}>
          <span className="text-gray-600">{label}</span>
          <span className={highlight ? 'text-emerald-700' : 'text-gray-800'}>{formatCurrency(value, currency)}</span>
        </div>
    );
    
    return (
        <Card className="clay-card border-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-600" />
                    Cost Calculation Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="details">Detailed Breakdown</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="pt-4 space-y-2">
                        <CalculationResult label={`Total Monthly Cost (for ${quantity} unit/s)`} value={total_monthly_cost} />
                        <CalculationResult label={`Total One-Time Cost (for ${quantity} unit/s)`} value={total_one_time_cost} />
                        <div className="border-t border-dashed my-2"></div>
                        <CalculationResult label="Subtotal" value={subtotal} />
                        <CalculationResult label={`VAT (${vatRate}%)`} value={tax_amount} />
                        <CalculationResult label="Grand Total" value={total_amount} highlight className="text-lg" />
                    </TabsContent>

                    <TabsContent value="details" className="pt-4">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="monthly">
                                <AccordionTrigger>Monthly Costs</AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Base Job Cost</TableCell>
                                                <TableCell className="text-right">{formatCurrency(base_job_cost, currency)}</TableCell>
                                            </TableRow>
                                            {monthlyComponents.map(comp => (
                                                <TableRow key={comp.id}>
                                                    <TableCell>{comp.component_name}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(comp.value, currency)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="one-time">
                                <AccordionTrigger>One-Time Costs</AccordionTrigger>
                                <AccordionContent>
                                     <Table>
                                        <TableBody>
                                            {oneTimeComponents.map(comp => (
                                                <TableRow key={comp.id}>
                                                    <TableCell>{comp.component_name}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(comp.value, currency)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="rules">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-600"/>
                                        Applied Rules & Logic
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                      {applied_rules?.map((exp, index) => (
                                          <li key={index}>
                                            <span className="font-semibold">{exp.name}:</span> {exp.details}
                                          </li>
                                      ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}