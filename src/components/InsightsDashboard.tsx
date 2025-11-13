import React, { useMemo } from 'react';
// FIX: Changed import paths to be relative
import type { Period, Transaction } from '../types';
import { useAppContext } from '../App';
import { MOOD_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { EmptyState } from './EmptyState';

const ChartCard: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, 'aria-label': string, id?: string }> = ({ title, subtitle, children, 'aria-label': ariaLabel, id }) => (
    <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl" aria-label={ariaLabel} id={id}>
        <div className="flex justify-between items-start mb-4">
            <div>
                 <h3 className="text-title-l font-medium text-on-surface-variant">{title}</h3>
                 {subtitle && <p className="text-body-m text-on-surface-variant/70">{subtitle}</p>}
            </div>
        </div>
        <div className="h-72 w-full">
            {children}
        </div>
    </div>
);

const MOOD_COLORS_CSS: Record<string, string> = {
    'Regret': '#ef4444',
    'Unsure': '#f59e0b',
    'Neutral': '#64748b',
    'Good': '#10b981',
    'Happy': '#22c55e',
};

export default function InsightsDashboard({ period }: { period: Period }) {
    const { transactions, formatCurrency } = useAppContext();

    const { currentPeriodTxs, previousPeriodTxs } = useMemo(() => {
        const now = new Date();
        
        const currentStart = new Date(now);
        if (period === 'D') currentStart.setHours(0, 0, 0, 0);
        else if (period === 'W') {
            const day = currentStart.getDay();
            const diff = currentStart.getDate() - day + (day === 0 ? -6 : 1); // Set to Monday
            currentStart.setDate(diff);
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

        const previousStart = new Date(currentStart);
        if (period === 'D') previousStart.setDate(previousStart.getDate() - 1);
        else if (period === 'W') previousStart.setDate(previousStart.getDate() - 7);
        else if (period === 'M') previousStart.setMonth(previousStart.getMonth() - 1);
        else if (period === 'Y') previousStart.setFullYear(previousStart.getFullYear() - 1);

        const previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

        const currentTxs = transactions.filter(tx => tx.ts >= currentStart.getTime());
        const previousTxs = transactions.filter(tx => tx.ts >= previousStart.getTime() && tx.ts < previousEnd.getTime());
        
        return { currentPeriodTxs: currentTxs, previousPeriodTxs: previousTxs };
    }, [transactions, period]);

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
            const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

    const tickColor = `rgb(var(--color-on-surface-variant))`;
    const primaryColor = `rgb(var(--color-primary))`;
    const tertiaryColor = `rgb(var(--color-tertiary))`;
    const compactCurrency = (val: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(val);

    if (currentPeriodTxs.length === 0) {
        return <EmptyState icon="search" title="Not Enough Data" message="There are no transactions for this period. Add some expenses to see your insights!" />;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                <div style={{'--stagger-delay': 1} as React.CSSProperties}>
                    <ChartCard title="Spending by Mood" aria-label="Pie chart showing spending distribution by mood." id="mood-chart-widget">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false} labelLine={false} activeIndex={-1} activeShape={{}} animationDuration={800}>
                                    {moodDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={MOOD_COLORS_CSS[entry.name.split(" ")[0] as keyof typeof MOOD_COLORS_CSS]} />
                                    ))}
                                </Pie>
                                <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '16px'}} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div style={{'--stagger-delay': 2} as React.CSSProperties}>
                    <ChartCard title="Top Categories" aria-label="Vertical bar chart showing the top 5 spending categories." id="category-chart-widget">
                        <ResponsiveContainer>
                            <BarChart data={spendingByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Bar dataKey="value" fill={primaryColor} radius={[0, 8, 8, 0]} barSize={20} activeBar={{}} animationDuration={800} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div className="md:col-span-2" style={{'--stagger-delay': 3} as React.CSSProperties}>
                    <ChartCard 
                        title="Spending Trend" 
                        subtitle="Current vs. Previous Period"
                        aria-label="Line chart showing total, positive mood, and negative mood spending over the selected period, compared to the previous period."
                        id="spending-comparison-chart-widget"
                    >
                        <ResponsiveContainer>
                            <LineChart data={spendingOverTime} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(var(--color-outline))`} strokeOpacity={0.2} />
                                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
                                <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(val) => compactCurrency(val)}/>
                                <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '16px'}} />
                                <Line type="monotone" dataKey="Current Period" stroke={primaryColor} strokeWidth={2} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{}} animationDuration={800} />
                                <Line type="monotone" dataKey="Previous Period" stroke={tertiaryColor} strokeWidth={2} strokeDasharray="5 5" dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{}} animationDuration={800} />
                                <Line type="monotone" dataKey="Positive" name="Positive Mood" stroke={MOOD_COLORS_CSS['Happy']} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{}} animationDuration={800} />
                                <Line type="monotone" dataKey="Negative" name="Negative Mood" stroke={MOOD_COLORS_CSS['Regret']} dot={{r: 4, strokeWidth: 2, fill: 'rgb(var(--color-surface))'}} activeDot={{}} animationDuration={800} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div className="md:col-span-2" style={{'--stagger-delay': 4} as React.CSSProperties}>
                    <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-title-l font-medium text-on-surface-variant">Top Merchants</h3>
                        </div>
                        <div className="space-y-3">
                            {topMerchants.map(({name, total, avgMood}) => (
                                <div key={name} className="flex items-center gap-4 p-3 bg-surface/80 rounded-2xl">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-variant">
                                        <avgMood.icon className={`w-6 h-6 ${avgMood.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{name}</p>
                                        <p className="text-sm text-on-surface-variant">{avgMood.label}</p>
                                    </div>
                                    <p className="font-bold text-base whitespace-nowrap">{formatCurrency(total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-on-surface-variant/70 text-body-m py-4 md:col-span-2">
                    More insights are coming soon.
                </p>
            </div>
        </>
    );
}