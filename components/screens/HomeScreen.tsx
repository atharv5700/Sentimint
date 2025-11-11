import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Screen, CoachingTip, FinanceTrick, Quote } from '../../types';
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
import { FINANCE_TRICKS } from '../../data/financeTricks';
import { QUOTES } from '../../data/quotes';
import FinanceTrickCard from '../FinanceTrickCard';
import QuoteCard from '../QuoteCard';

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

export default function HomeScreen({ onEditTransaction, setScreen }: HomeScreenProps) {
    const { transactions, formatCurrency, setIsBulkMode, budgets, openTransactionModal, streak } = useAppContext();
    const [tip, setTip] = useState<CoachingTip | null>(null);
    const [digest, setDigest] = useState<{ summary: string | null; weekKey: string } | null>(null);
    const [dailyTrick, setDailyTrick] = useState<FinanceTrick | null>(null);
    const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
    
    useEffect(() => {
        const fetchTip = async () => {
            const tipData = await mintorAiService.getCoachingTip();
            setTip(tipData);
        };
        fetchTip();

        const getDayOfYear = () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now.getTime() - start.getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor(diff / oneDay);
        };

        const dayIndex = getDayOfYear();
        setDailyTrick(FINANCE_TRICKS[dayIndex % FINANCE_TRICKS.length]);
        setDailyQuote(QUOTES[dayIndex % QUOTES.length]);

    }, [transactions]);
    
    useEffect(() => {
        const today = new Date();
        const todayKey = getWeekKey(today);
        const lastDigestKey = localStorage.getItem('sentimint_last_digest_week');
        
        // Only generate if it's Monday and we haven't generated for this week yet.
        if (digest?.weekKey !== todayKey && today.getDay() === 1 && todayKey !== lastDigestKey) {
            const summary = mintorAiService.generateWeeklyDigest(transactions);
            if (summary) {
                setDigest({ summary, weekKey: todayKey });
                localStorage.setItem('sentimint_last_digest_week', todayKey);
            }
        }
    }, [transactions, digest]);

    const transactionsForWidget = useMemo(() => {
        // Use all transactions to calculate the total spending.
        return transactions;
    }, [transactions]);

    const recentTransactions = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        // Set to the most recent Monday. If today is Sunday, it goes back to last Monday.
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        return transactions
            .filter(tx => tx.ts >= startOfWeek.getTime())
            .sort((a, b) => b.ts - a.ts);
    }, [transactions]);

    const { totalSpent, avgMood } = useMemo(() => {
        if (transactionsForWidget.length === 0) {
            return { totalSpent: 0, avgMood: null };
        }
        const total = transactionsForWidget.reduce((sum, tx) => sum + tx.amount, 0);
        const moodSum = transactionsForWidget.reduce((sum, tx) => sum + tx.mood, 0);
        const avg = Math.round(moodSum / transactionsForWidget.length);
        return { totalSpent: total, avgMood: MOOD_MAP[avg as keyof typeof MOOD_MAP] || MOOD_MAP[3] };
    }, [transactionsForWidget]);

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
        <div className="relative">
            <div className="px-4 pb-4 space-y-4">
                <div className="animate-screenFadeIn" style={{ animationDelay: '50ms' }}>
                    <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
                        <div className="text-center">
                            <p className="text-body-m text-on-surface">Total Spending</p>
                            <p className="text-display-m font-bold text-on-surface">{formatCurrency(animatedTotalSpent)}</p>
                            <div className="flex justify-center items-center gap-2 mt-2">
                                {avgMood && (
                                    <div className="bg-surface-variant/40 backdrop-blur-sm border border-outline/10 text-on-surface-variant px-3 py-1.5 rounded-2xl text-sm font-medium">
                                        <span>Avg. Mood: {avgMood.label}</span>
                                    </div>
                                )}
                                <StreakCounter streak={streak} />
                            </div>
                        </div>
                    </div>
                </div>
                
                {dailyQuote && (
                    <div className="animate-screenFadeIn" style={{ animationDelay: '100ms' }}>
                        <QuoteCard quote={dailyQuote} />
                    </div>
                )}

                {digest && (
                     <div className="animate-screenFadeIn" style={{ animationDelay: '150ms' }}>
                        <WeeklyDigest digest={digest} />
                     </div>
                )}
                
                {tip && (
                    <div className="animate-screenFadeIn" style={{ animationDelay: '200ms' }}>
                        <CoachingTipCard tip={tip} setScreen={setScreen} />
                    </div>
                )}

                {dailyTrick && (
                     <div className="animate-screenFadeIn" style={{ animationDelay: '250ms' }}>
                        <FinanceTrickCard trick={dailyTrick} />
                    </div>
                )}

                {budgetStatus.length > 0 && (
                    <div className="animate-screenFadeIn" style={{ animationDelay: '300ms' }}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-title-m font-medium text-on-surface">Monthly Budgets</h3>
                            <button onClick={() => { hapticClick(); setScreen('Budgets'); }} className="text-primary font-medium text-sm">Manage</button>
                        </div>
                        <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
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

                <div className="animate-screenFadeIn" style={{ animationDelay: '350ms' }}>
                    {recentTransactions.length > 0 ? (
                        <>
                            <h3 className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 rounded-2xl py-3 px-4 my-2 text-title-m font-medium text-on-surface-variant">This Week's Transactions</h3>
                            <TransactionList 
                                transactions={recentTransactions} 
                                onEditTransaction={onEditTransaction} 
                                isBulkSelectEnabled={true}
                                onBulkModeChange={setIsBulkMode}
                                showMonthHeaders={false}
                            />
                        </>
                    ) : (
                        <EmptyState
                            icon="box"
                            title="No Expenses This Week"
                            message="Your transactions for the current week will appear here."
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