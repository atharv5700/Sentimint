import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Period, Screen } from '../../types';
import { useAppContext } from '../../App';
import { MOOD_MAP, PlusIcon } from '../../constants';
import TransactionList from '../TransactionList';

interface HomeScreenProps {
    onAddTransaction: () => void;
    onEditTransaction: (tx: Transaction) => void;
    setScreen: (screen: Screen) => void;
}

const PeriodSelector: React.FC<{ selected: Period, onSelect: (value: Period) => void }> = ({ selected, onSelect }) => {
    const [isCompact, setIsCompact] = useState(window.innerWidth < 360);

    useEffect(() => {
        const handleResize = () => setIsCompact(window.innerWidth < 360);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const options: {label: string, value: Period}[] = [
        {label: 'Day', value: 'D'}, {label: 'Week', value: 'W'},
        {label: 'Month', value: 'M'}, {label: 'Year', value: 'Y'}
    ];
    
    const baseClasses = "transition-colors duration-200 rounded-full font-medium";
    const selectedClasses = "bg-secondary-container text-on-secondary-container";
    const unselectedClasses = "text-on-surface-variant";

    if (isCompact) {
        return (
            <div className="flex justify-center gap-2">
                {options.map(({ value }) => (
                     <button
                        key={value}
                        onClick={() => onSelect(value)}
                        className={`${baseClasses} w-10 h-10 text-sm ${selected === value ? selectedClasses : 'bg-surface-variant/50'}`}
                    >
                        {value}
                    </button>
                ))}
            </div>
        );
    }
    
    return (
        <div className="flex justify-center p-1 bg-surface rounded-full">
            {options.map(({label, value}) => (
                <button
                    key={value}
                    onClick={() => onSelect(value)}
                    className={`${baseClasses} px-4 py-1.5 text-sm ${selected === value ? selectedClasses : unselectedClasses}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};


export default function HomeScreen({ onAddTransaction, onEditTransaction, setScreen }: HomeScreenProps) {
    const { transactions, formatCurrency } = useAppContext();
    const [period, setPeriod] = useState<Period>('M');

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

    return (
        <div className="relative h-full">
            <div className="px-4 pt-4">
                 <div className="bg-surface-variant text-on-surface-variant p-4 rounded-3xl space-y-4">
                    <div className="bg-surface p-1 rounded-full">
                        <PeriodSelector selected={period} onSelect={setPeriod} />
                    </div>
                    <div className="text-center">
                        <p className="text-body-m text-on-surface-variant">Total Spent</p>
                        <p className="text-headline-m font-bold text-on-surface-variant">{formatCurrency(totalSpent)}</p>
                        {avgMood && (
                            <div className="inline-flex items-center gap-1 bg-surface text-on-surface px-3 py-1 rounded-full mt-2 text-sm">
                                <span>Avg. Mood:</span>
                                <avgMood.icon className={`w-5 h-5 ${avgMood.color}`} />
                                <span>{avgMood.label}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="px-4 mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-title-m font-medium text-on-surface">Recent Expenses</h3>
                    <button onClick={() => setScreen('Transactions')} className="text-primary font-medium text-sm">View All</button>
                </div>
                <TransactionList 
                    transactions={filteredTransactions.slice(0, 10)} 
                    onEditTransaction={onEditTransaction} 
                    showDate={true}
                    isBulkSelectEnabled={true}
                />
            </div>

            <button
                onClick={onAddTransaction}
                className="fixed bottom-24 right-6 bg-primary-container text-on-primary-container rounded-2xl shadow-lg w-14 h-14 flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                aria-label="Add Transaction"
            >
                <PlusIcon className="w-7 h-7" />
            </button>
        </div>
    );
}