import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import { MOOD_MAP } from '../constants';

const MoodRow: React.FC<{
    icon: React.FC<any>;
    label: string;
    amount: number;
    percentage: number;
    color: string;
    formatCurrency: (amount: number) => string;
}> = ({ icon: Icon, label, amount, percentage, color, formatCurrency }) => (
    <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 flex-shrink-0 ${color}`} />
        <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-on-surface-variant">{label}</span>
                <span className="text-sm font-bold text-on-surface-variant">{formatCurrency(amount)}</span>
            </div>
            <div className="w-full bg-outline-variant/30 rounded-full h-1.5">
                <div 
                    className={`${color.replace('text-', 'bg-')} h-1.5 rounded-full`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export default function WeeklyMoodSummary() {
    const { transactions, formatCurrency } = useAppContext();

    const moodData = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        // Set to the most recent Monday. If today is Sunday, it goes back to last Monday.
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekTxs = transactions.filter(tx => tx.ts >= startOfWeek.getTime());
        if (thisWeekTxs.length === 0) return null;

        const totalSpent = thisWeekTxs.reduce((sum, tx) => sum + tx.amount, 0);

        const spendingByMood = thisWeekTxs.reduce((acc, tx) => {
            const moodLabel = MOOD_MAP[tx.mood].label;
            acc[moodLabel] = (acc[moodLabel] || 0) + tx.amount;
            return acc;
        }, {} as Record<string, number>);

        const moodLevels = Object.keys(MOOD_MAP).map(Number).sort((a,b) => b-a); // 5 down to 1

        return moodLevels.map(level => {
            const { label, icon, color } = MOOD_MAP[level as keyof typeof MOOD_MAP];
            const amount = spendingByMood[label] || 0;
            return {
                label,
                icon,
                color,
                amount,
                percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
            };
        }).filter(mood => mood.amount > 0);

    }, [transactions, formatCurrency]);

    if (!moodData || moodData.length === 0) {
        return null;
    }

    return (
        <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-3">
            <h3 className="text-title-m font-medium text-on-surface text-center">Weekly Mood Spending</h3>
            {moodData.map(mood => (
                <MoodRow key={mood.label} {...mood} formatCurrency={formatCurrency} />
            ))}
        </div>
    );
}