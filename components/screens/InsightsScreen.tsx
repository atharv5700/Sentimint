import React, { useState } from 'react';
import type { Period } from '../../types';
import InsightsDashboard from '../InsightsDashboard';

const SegmentedButton: React.FC<{ options: {label: string, value: Period}[], selected: Period, onSelect: (value: Period) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex justify-center p-1 bg-surface-variant/50 rounded-full mx-auto max-w-sm">
        {options.map(({label, value}) => (
            <button
                key={value}
                onClick={() => onSelect(value)}
                className={`w-full px-4 sm:px-6 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    selected === value ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant'
                }`}
            >
                {label}
            </button>
        ))}
    </div>
);

export default function InsightsScreen() {
    const [period, setPeriod] = useState<Period>('M');

    return (
        <div className="p-4 space-y-6">
            <div className="animate-screenFadeIn" style={{ animationDelay: '50ms' }}>
                <SegmentedButton
                    options={[
                        {label: 'Day', value: 'D'}, 
                        {label: 'Week', value: 'W'},
                        {label: 'Month', value: 'M'},
                        {label: 'Year', value: 'Y'}
                    ]}
                    selected={period}
                    onSelect={setPeriod}
                />
            </div>
            
            <div className="animate-screenFadeIn" style={{ animationDelay: '150ms' }}>
                <InsightsDashboard period={period} />
            </div>
        </div>
    );
}