import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Transaction, Period, Screen, CoachingTip } from '../../types';
import { useAppContext } from '../../App';
import { MOOD_MAP } from '../../constants';
import TransactionList from '../TransactionList';
import ProgressBar from '../ProgressBar';
import { mintorAiService } from '../../services/mintorAi';
import CoachingTipCard from '../CoachingTipCard';
import WeeklyDigest from '../WeeklyDigest';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { EmptyState } from '../EmptyState';
import { hapticClick } from '../../services/haptics';
import StreakCounter from '../StreakCounter';

interface HomeScreenProps {
    onEditTransaction: (tx: Transaction) => void;
    setScreen: (screen: Screen) => void;
}

const getWeekKey = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return date.getFullYear() + '-' + (1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7));
};

const PeriodSelector: React.FC<{ selected: Period, onSelect: (value: Period) => void }> = ({ selected, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({});

    const options: {label: string, value: Period}[] = [
        {label: 'Day', value: 'D'}, {label: 'Week', value: 'W'},
        {label: 'Month', value: 'M'}, {label: 'Year', value: 'Y'}
    ];

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const selectedIndex = options.findIndex(opt => opt.value === selected);
        if (selectedIndex === -1) return;

        const selectedButton = container.children[selectedIndex + 1] as HTMLElement; // +1 for pill
        if (selectedButton) {
            setPillStyle({
                left: `${selectedButton.offsetLeft}px`,
                width: `${selectedButton.offsetWidth}px`,
            });
        }
    }, [selected, options]);

    return (
        <div ref={containerRef} className="relative flex justify-center p-1 bg-surface-variant/50 rounded-full">
            <div 
                className="absolute top-1 bottom-1 bg-primary-container rounded-full shadow transition-all duration-300 ease-out"
                style={pillStyle}
            />
            {options.map(({label, value}) => (
                <button
                    key={value}
                    onClick={() => { hapticClick(); onSelect(value); }}
                    className={`relative z-10 w-full px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${selected === value ? 'text-on-primary-container' : 'text-on-surface-variant'}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};


export default function HomeScreen({ onEditTransaction, setScreen }: HomeScreenProps) {
    const { transactions, formatCurrency, setIsBulkMode, budgets, openTransactionModal, streak } = useAppContext();
    const [period, setPeriod] = useState<Period>('M');
    const [tip, setTip] = useState<CoachingTip | null>(null);
    const [digest, setDigest] = useState<{ summary: string | null; weekKey: string } | null>(null);
    
    useEffect(() => {
        const tipData = mintorAiService.getCoachingTip();
        setTip(tipData);
    }, [transactions]);
    
    useEffect(() => {
        const today = new Date();
        const todayKey = getWeekKey(today);
        const lastDigestKey = localStorage.getItem('sentimint_last_digest_week');
        
        if (today.getDay() === 1 && todayKey !== lastDigestKey) {
            const summary = mintorAiService.generateWeeklyDigest(transactions);
            if (summary) {
                setDigest({ summary, weekKey: todayKey });
                localStorage.setItem('sentimint_last_digest_week', todayKey);
            }
        }
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfPeriod = new Date(now);
        switch (period) {
            case 'D':
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
            case 'W':
                startOfPeriod.setDate(now.getDate() - now.getDay());
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
            case 'M':
                startOfPeriod.setDate(1);
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
            case 'Y':
                startOfPeriod.setMonth(0, 1);
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
        }
        return transactions.filter(tx => tx.ts >= startOfPeriod.getTime());
    }, [transactions, period]);

    const { totalSpent, avgMood } = useMemo(() => {
        if (filteredTransactions.length === 0) {
            return { totalSpent: 0, avgMood: null };
        }
        const total = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const moodSum = filteredTransactions.reduce((sum, tx) => sum + tx.mood, 0);
        const avg = Math.round(moodSum / filteredTransactions.length);
        return { totalSpent: total, avgMood: MOOD_MAP[avg as keyof typeof MOOD_MAP] || MOOD_MAP[3] };
    }, [filteredTransactions]);

    const animatedTotalSpent = useAnimatedCounter(totalSpent);

    const budgetStatus = useMemo(() => {
        if (!budgets || budgets.length === 0) return [];

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyTxs = transactions.filter(tx => tx.ts >= startOfMonth.getTime());

        return budgets.map(budget => {
            const spent = monthlyTxs
                .filter(tx => tx.category === budget.category)
                .reduce((sum, tx) => sum + tx.amount, 0);
            return {
                ...budget,
                spent,
                progress: (spent / budget.amount) * 100,
            };
        }).sort((a, b) => b.progress - a.progress); // Sort by most spent
    }, [budgets, transactions]);


    return (
        <div className="relative h-full">
            <div className="px-4 pb-4 space-y-4">
                <div className="animate-screenFadeIn" style={{ animationDelay: '50ms' }}>
                    <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-4">
                        <PeriodSelector selected={period} onSelect={setPeriod} />
                        <div className="text-center">
                            <p className="text-body-m text-on-surface">Total Spent</p>
                            <p className="text-display-l font-bold text-on-surface">{formatCurrency(animatedTotalSpent)}</p>
                            <div className="flex justify-center items-center gap-2 mt-2">
                                {avgMood && (
                                    <div className="bg-surface-variant/50 text-on-surface-variant px-3 py-1.5 rounded-full text-sm font-medium">
                                        <span>Avg. Mood: {avgMood.label}</span>
                                    </div>
                                )}
                                <StreakCounter streak={streak} />
                            </div>
                        </div>
                    </div>
                </div>

                {digest && (
                     <div className="animate-screenFadeIn" style={{ animationDelay: '100ms' }}>
                        <WeeklyDigest digest={digest} />
                     </div>
                )}
                
                {tip && (
                    <div className="animate-screenFadeIn" style={{ animationDelay: '150ms' }}>
                        <CoachingTipCard tip={tip} setScreen={setScreen} />
                    </div>
                )}

                {budgetStatus.length > 0 && (
                    <div className="animate-screenFadeIn" style={{ animationDelay: '200ms' }}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-title-m font-medium text-on-surface">Monthly Budgets</h3>
                            <button onClick={() => { hapticClick(); setScreen('Goals'); }} className="text-primary font-medium text-sm">Manage</button>
                        </div>
                        <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-4">
                            {budgetStatus.slice(0, 3).map(budget => (
                                <div key={budget.id}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-medium text-on-surface-variant">{budget.category}</span>
                                        <span className="text-on-surface-variant/80">{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span>
                                    </div>
                                    <ProgressBar progress={budget.progress} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="animate-screenFadeIn" style={{ animationDelay: '250ms' }}>
                    {filteredTransactions.length > 0 ? (
                        <TransactionList 
                            transactions={filteredTransactions.slice(0, 10)} 
                            onEditTransaction={onEditTransaction} 
                            isBulkSelectEnabled={true}
                            onBulkModeChange={setIsBulkMode}
                        />
                    ) : (
                        <EmptyState
                            icon="box"
                            title="No Expenses Yet"
                            message={`Your recent transactions for this ${period === 'D' ? 'day' : period === 'W' ? 'week' : period === 'M' ? 'month' : 'year'} will appear here.`}
                            action={transactions.length === 0 ? {
                                label: "Add First Transaction",
                                onClick: () => {
                                    hapticClick();
                                    openTransactionModal(null);
                                }
                            } : undefined}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}