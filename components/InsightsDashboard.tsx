import React, { useMemo, useState } from 'react';
import type { Period, Transaction } from '../types';
import { useAppContext } from '../App';
import { MOOD_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { ExportDataModal } from './screens/SettingsScreen';


const Widget: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, onExport: () => void, 'aria-label': string, id?: string }> = ({ title, subtitle, children, onExport, 'aria-label': ariaLabel, id }) => (
    <div className="bg-surface-variant p-4 rounded-3xl shadow-sm" aria-label={ariaLabel} id={id}>
        <div className="flex justify-between items-start mb-4">
            <div>
                 <h3 className="text-title-m font-medium text-on-surface-variant">{title}</h3>
                 {subtitle && <p className="text-label-s text-on-surface-variant/70">{subtitle}</p>}
            </div>
            <button onClick={onExport} className="text-xs font-medium bg-surface text-on-surface px-2 py-1 rounded-full">CSV</button>
        </div>
        <div className="h-72 w-full">
            {children}
        </div>
    </div>
);

const MOOD_COLORS: Record<string, string> = {
    'Regret': '#EF4444',
    'Unsure': '#FB923C',
    'Neutral': '#9CA3AF',
    'Good': '#34D399',
    'Happy': '#22C55E',
};

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-inverse-surface text-inverse-on-surface p-2 rounded-lg shadow-lg text-sm">
                <p className="font-bold">{label}</p>
                {payload.map((pld: any) => (
                     <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name || pld.dataKey}: ${formatter(pld.value)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const dataToCsv = (data: any[]): string => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header])).join(','));
    return [headers.join(','), ...rows].join('\n');
}

export default function InsightsDashboard({ period }: { period: Period }) {
    const { transactions, formatCurrency, theme } = useAppContext();
    const [exportModal, setExportModal] = useState<{isOpen: boolean, data: string}>({ isOpen: false, data: ''});

    const { currentPeriodTxs, previousPeriodTxs } = useMemo(() => {
        const now = new Date();
        
        // Calculate current period start
        const currentStart = new Date(now);
        if (period === 'D') currentStart.setHours(0, 0, 0, 0);
        else if (period === 'W') {
            currentStart.setDate(now.getDate() - now.getDay());
            currentStart.setHours(0, 0, 0, 0);
        }
        else if (period === 'M') {
            currentStart.setDate(1);
            currentStart.setHours(0, 0, 0, 0);
        }
        else if (period === 'Y') {
            currentStart.setMonth(0, 1);
            currentStart.setHours(0, 0, 0, 0);
        }

        // Calculate previous period start
        const previousStart = new Date(currentStart);
        if (period === 'D') previousStart.setDate(previousStart.getDate() - 1);
        else if (period === 'W') previousStart.setDate(previousStart.getDate() - 7);
        else if (period === 'M') previousStart.setMonth(previousStart.getMonth() - 1);
        else if (period === 'Y') previousStart.setFullYear(previousStart.getFullYear() - 1);

        // Calculate previous period end
        const previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

        const currentTxs = transactions.filter(tx => tx.ts >= currentStart.getTime());
        const previousTxs = transactions.filter(tx => tx.ts >= previousStart.getTime() && tx.ts < previousEnd.getTime());
        
        return { currentPeriodTxs: currentTxs, previousPeriodTxs: previousTxs };
    }, [transactions, period]);

    const handleExport = (data: any[]) => {
        const csv = dataToCsv(data);
        if (csv) {
            setExportModal({ isOpen: true, data: csv });
        }
    }

    const moodDistribution = useMemo(() => {
        const counts: Record<string, number> = currentPeriodTxs.reduce((acc: Record<string, number>, tx: Transaction) => {
            const moodLabel = MOOD_MAP[tx.mood].label;
            acc[moodLabel] = (acc[moodLabel] || 0) + tx.amount;
            return acc;
        }, {});
        
        const total = Object.values(counts).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
        if (total === 0) return [];

        return Object.entries(counts)
            .filter(([, value]) => typeof value === 'number' && value > 0)
            .map(([name, value]) => ({ name: `${name} ${((value/total)*100).toFixed(0)}%`, value }));

    }, [currentPeriodTxs]);

    const spendingByCategory = useMemo(() => {
        const totals: Record<string, number> = currentPeriodTxs.reduce((acc: Record<string, number>, tx: Transaction) => {
            acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
            return acc;
        }, {});
        
        return Object.entries(totals)
            .filter(([, value]) => typeof value === 'number')
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5);
    }, [currentPeriodTxs]);

    const spendingOverTime = useMemo(() => {
        const processTxs = (txs: Transaction[], isPrevious = false) => {
            const dataMap: { [key: string]: number } = {};
            txs.forEach(tx => {
                let key: string;
                const date = new Date(tx.ts);
                const prevDate = new Date(tx.ts);
                if (isPrevious) {
                    if (period === 'D') prevDate.setDate(prevDate.getDate() + 1);
                    else if (period === 'W') prevDate.setDate(prevDate.getDate() + 7);
                    else if (period === 'M') prevDate.setMonth(prevDate.getMonth() + 1);
                    else if (period === 'Y') prevDate.setFullYear(prevDate.getFullYear() + 1);
                }
                const effectiveDate = isPrevious ? prevDate : date;

                if (period === 'D') key = effectiveDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
                else if (period === 'W') key = effectiveDate.toLocaleDateString('en-IN', { weekday: 'short' });
                else if (period === 'M') key = `W${Math.ceil(effectiveDate.getDate() / 7)}`;
                else key = effectiveDate.toLocaleDateString('en-IN', { month: 'short' });
                
                dataMap[key] = (dataMap[key] || 0) + tx.amount;
            });
            return dataMap;
        };
        
        const currentDataMap = processTxs(currentPeriodTxs);
        const previousDataMap = processTxs(previousPeriodTxs, true);
        
        const moodDataMap: { [key: string]: { Positive: number, Negative: number } } = {};
        currentPeriodTxs.forEach(tx => {
            const date = new Date(tx.ts);
            let key: string;
            if (period === 'D') key = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
            else if (period === 'W') key = date.toLocaleDateString('en-IN', { weekday: 'short' });
            else if (period === 'M') key = `W${Math.ceil(date.getDate() / 7)}`;
            else key = date.toLocaleDateString('en-IN', { month: 'short' });

            if (!moodDataMap[key]) moodDataMap[key] = { Positive: 0, Negative: 0 };
            if (tx.mood >= 4) moodDataMap[key].Positive += tx.amount;
            if (tx.mood <= 2) moodDataMap[key].Negative += tx.amount;
        });

        const allKeys = [...new Set([...Object.keys(currentDataMap), ...Object.keys(previousDataMap)])];

        let sortedKeys: string[];
        if (period === 'W') {
            const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            sortedKeys = allKeys.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        } else if (period === 'M') {
            sortedKeys = allKeys.sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
        } else if (period === 'Y') {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            sortedKeys = allKeys.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
        } else {
            sortedKeys = allKeys.sort();
        }

        return sortedKeys.map(key => ({
            name: key,
            'Current Period': currentDataMap[key] || 0,
            'Previous Period': previousDataMap[key] || 0,
            'Positive': moodDataMap[key]?.Positive || 0,
            'Negative': moodDataMap[key]?.Negative || 0,
        }));

    }, [currentPeriodTxs, previousPeriodTxs, period]);

    const topMerchants = useMemo(() => {
        const merchants: Record<string, {total: number, moods: number[]}> = currentPeriodTxs.reduce((acc, tx) => {
            if (!tx.merchant) return acc;
            if (!acc[tx.merchant]) acc[tx.merchant] = { total: 0, moods: [] };
            acc[tx.merchant].total += tx.amount;
            acc[tx.merchant].moods.push(tx.mood);
            return acc;
        }, {} as Record<string, {total: number, moods: number[]}>);

        const merchantsArray = Object.entries(merchants);

        return merchantsArray
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
            .map(([name, data]) => {
                const avgMoodValue = data.moods.length > 0
                    ? Math.round(data.moods.reduce((a, b) => a + b, 0) / data.moods.length)
                    : 3; // Default to Neutral if no moods
                return {
                    name,
                    total: data.total,
                    avgMood: MOOD_MAP[avgMoodValue as keyof typeof MOOD_MAP] || MOOD_MAP[3]
                };
            });
    }, [currentPeriodTxs]);


    const tickColor = theme === 'dark' ? '#C2C7C5' : '#424846';
    const primaryColor = theme === 'dark' ? 'rgb(31 200 167)' : 'rgb(0 107 88)';
    const tertiaryColor = theme === 'dark' ? 'rgb(167 199 228)' : 'rgb(68 99 125)';
    const compactCurrency = (val: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(val);

    if (currentPeriodTxs.length === 0) {
        return <div className="text-center text-on-surface-variant p-8">Not enough data for this period.</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                <div style={{'--stagger-delay': 1} as React.CSSProperties}>
                    <Widget title="Spending by Mood" onExport={() => handleExport(moodDistribution)} aria-label="Pie chart showing spending distribution by mood." id="mood-chart-widget">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false} labelLine={false}>
                                    {moodDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name.split(" ")[0] as keyof typeof MOOD_COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />}/>
                                <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{paddingTop: '16px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Widget>
                </div>
                <div style={{'--stagger-delay': 2} as React.CSSProperties}>
                    <Widget title="Top 5 Categories" onExport={() => handleExport(spendingByCategory)} aria-label="Vertical bar chart showing the top 5 spending categories." id="category-chart-widget">
                        <ResponsiveContainer>
                            <BarChart data={spendingByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} cursor={{fill: 'rgba(128,128,128,0.1)'}}/>
                                <Bar dataKey="value" fill={primaryColor} radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Widget>
                </div>
                <div className="md:col-span-2" style={{'--stagger-delay': 3} as React.CSSProperties}>
                    <Widget 
                        title="Spending Comparison" 
                        subtitle="Current vs. Previous Period"
                        onExport={() => handleExport(spendingOverTime)} 
                        aria-label="Line chart showing total, positive mood, and negative mood spending over the selected period, compared to the previous period."
                        id="spending-comparison-chart-widget"
                    >
                        <ResponsiveContainer>
                            <LineChart data={spendingOverTime} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
                                <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(val) => compactCurrency(val)}/>
                                <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                                <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '16px'}}/>
                                <Line type="monotone" dataKey="Current Period" stroke={primaryColor} strokeWidth={2} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="Previous Period" stroke={tertiaryColor} strokeWidth={2} strokeDasharray="5 5" dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="Positive" name="Positive Mood (Current)" stroke={MOOD_COLORS['Happy']} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="Negative" name="Negative Mood (Current)" stroke={MOOD_COLORS['Regret']} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Widget>
                </div>
                <div className="md:col-span-2" style={{'--stagger-delay': 4} as React.CSSProperties}>
                    <Widget title="Top 5 Merchants" onExport={() => handleExport(topMerchants.map(m=>({name: m.name, total: m.total, avg_mood: m.avgMood.label})))} aria-label="Table showing the top 5 merchants by total spending, with their average transaction mood.">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-outline">
                                        <th className="p-2 text-label-s">Merchant</th>
                                        <th className="p-2 text-label-s text-center">Avg. Mood</th>
                                        <th className="p-2 text-label-s text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topMerchants.map(({name, total, avgMood}) => (
                                        <tr key={name} className="border-b border-outline-variant/50">
                                            <td className="p-2 text-body-m">{name}</td>
                                            <td className="p-2">
                                                <div className="flex items-center justify-center gap-1.5">
                                                     <avgMood.icon className={`w-5 h-5 ${avgMood.color}`} />
                                                     <span className="text-sm hidden sm:inline">{avgMood.label}</span>
                                                </div>
                                            </td>
                                            <td className="p-2 text-body-m font-medium text-right">{formatCurrency(total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Widget>
                </div>

                <div className="text-center text-on-surface-variant p-8 md:col-span-2">
                    Deeper insights and predictive analysis are coming soon.
                </div>
            </div>
            {exportModal.isOpen && <ExportDataModal csvData={exportModal.data} onClose={() => setExportModal({isOpen: false, data: ''})} />}
        </>
    );
}