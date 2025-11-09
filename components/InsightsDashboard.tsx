import React, { useMemo, useState } from 'react';
import type { Period, Transaction } from '../types';
import { useAppContext } from '../App';
import { MOOD_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { ExportDataModal } from './screens/SettingsScreen';


const Widget: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, onExport: () => void, 'aria-label': string }> = ({ title, subtitle, children, onExport, 'aria-label': ariaLabel }) => (
    <div className="bg-surface-variant p-4 rounded-3xl shadow-sm" aria-label={ariaLabel}>
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

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfPeriod = new Date(now);
        switch (period) {
            case 'D': startOfPeriod.setHours(0, 0, 0, 0); break;
            case 'W': startOfPeriod.setDate(now.getDate() - now.getDay()); startOfPeriod.setHours(0, 0, 0, 0); break;
            case 'M': startOfPeriod.setDate(1); startOfPeriod.setHours(0, 0, 0, 0); break;
            case 'Y': startOfPeriod.setMonth(0, 1); startOfPeriod.setHours(0, 0, 0, 0); break;
        }
        return transactions.filter(tx => tx.ts >= startOfPeriod.getTime());
    }, [transactions, period]);

    const handleExport = (data: any[]) => {
        const csv = dataToCsv(data);
        if (csv) {
            setExportModal({ isOpen: true, data: csv });
        }
    }

    const moodDistribution = useMemo(() => {
        const counts: Record<string, number> = filteredTransactions.reduce((acc: Record<string, number>, tx: Transaction) => {
            const moodLabel = MOOD_MAP[tx.mood].label;
            acc[moodLabel] = (acc[moodLabel] || 0) + tx.amount;
            return acc;
        }, {});
        
        const total = Object.values(counts).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
        if (total === 0) return [];

        return Object.entries(counts)
            .filter(([, value]) => typeof value === 'number' && value > 0)
            .map(([name, value]) => ({ name: `${name} ${((value/total)*100).toFixed(0)}%`, value }));

    }, [filteredTransactions]);

    const spendingByCategory = useMemo(() => {
        const totals: Record<string, number> = filteredTransactions.reduce((acc: Record<string, number>, tx: Transaction) => {
            acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
            return acc;
        }, {});
        
        return Object.entries(totals)
            .filter(([, value]) => typeof value === 'number')
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredTransactions]);

    const spendingOverTime = useMemo(() => {
        const dataMap: { [key: string]: { Total: number, Positive: number, Negative: number } } = {};
        
        filteredTransactions.forEach(tx => {
            let key;
            const date = new Date(tx.ts);
            if (period === 'D') key = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
            else if (period === 'W') key = date.toLocaleDateString('en-IN', { weekday: 'short' });
            else if (period === 'M') key = `W${Math.ceil(date.getDate() / 7)}`;
            else key = date.toLocaleDateString('en-IN', { month: 'short' });

            if (!dataMap[key]) dataMap[key] = { Total: 0, Positive: 0, Negative: 0 };
            
            dataMap[key].Total += tx.amount;
            if (tx.mood >= 4) dataMap[key].Positive += tx.amount;
            if (tx.mood <= 2) dataMap[key].Negative += tx.amount;
        });
        
        const entries = Object.entries(dataMap);
        let sortedEntries: [string, { Total: number; Positive: number; Negative: number; }][];

        if (period === 'D') {
            sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
        } else if (period === 'W') {
            const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            sortedEntries = entries.sort((a, b) => dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0]));
        } else if (period === 'M') {
            sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
        } else if (period === 'Y') {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            sortedEntries = entries.sort((a, b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]));
        } else {
            sortedEntries = entries;
        }

        return sortedEntries.map(([name, values]) => ({ name, ...values }));

    }, [filteredTransactions, period]);

    const topMerchants = useMemo(() => {
        const merchants: Record<string, {total: number, moods: number[]}> = filteredTransactions.reduce((acc, tx) => {
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
    }, [filteredTransactions]);


    const tickColor = theme === 'dark' ? '#C2C7C5' : '#424846';
    const primaryColor = theme === 'dark' ? 'rgb(31 200 167)' : 'rgb(0 107 88)';
    const compactCurrency = (val: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(val);

    if (filteredTransactions.length === 0) {
        return <div className="text-center text-on-surface-variant p-8">Not enough data for this period.</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                <div style={{'--stagger-delay': 1} as React.CSSProperties}>
                    <Widget title="Spending by Mood" onExport={() => handleExport(moodDistribution)} aria-label="Pie chart showing spending distribution by mood.">
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
                    <Widget title="Top 5 Categories" onExport={() => handleExport(spendingByCategory)} aria-label="Vertical bar chart showing the top 5 spending categories.">
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
                    <Widget title="Spending Over Time" onExport={() => handleExport(spendingOverTime)} aria-label="Line chart showing total, positive mood, and negative mood spending over the selected period.">
                        <ResponsiveContainer>
                            <LineChart data={spendingOverTime} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
                                <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(val) => compactCurrency(val)}/>
                                <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                                <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '16px'}}/>
                                <Line type="monotone" dataKey="Total" name="Total Spend" stroke="rgb(var(--color-tertiary))" strokeWidth={2} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="Positive" name="Positive Mood" stroke={MOOD_COLORS['Happy']} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="Negative" name="Negative Mood" stroke={MOOD_COLORS['Regret']} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{r: 6}} />
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
                                        <th className="p-2 text-label-s">Avg. Mood</th>
                                        <th className="p-2 text-label-s text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topMerchants.map(({name, total, avgMood}) => (
                                        <tr key={name} className="border-b border-outline-variant/50">
                                            <td className="p-2 text-body-m">{name}</td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-1.5">
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