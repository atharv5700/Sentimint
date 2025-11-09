import React, { useState } from 'react';
import type { Period } from '../../types';
import InsightsDashboard from '../InsightsDashboard';
import { hapticClick } from '../../services/haptics';
import { useAppContext } from '../../App';
import { reportService } from '../../services/reportGenerator';

const SegmentedButton: React.FC<{ options: {label: string, value: Period}[], selected: Period, onSelect: (value: Period) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex justify-center p-1 bg-surface-variant/50 rounded-full mx-auto max-w-sm">
        {options.map(({label, value}) => (
            <button
                key={value}
                onClick={() => { hapticClick(); onSelect(value); }}
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
    const { transactions, theme } = useAppContext();
    const [period, setPeriod] = useState<Period>('M');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = () => {
        hapticClick();
        setIsGenerating(true);

        // Allow UI to update before generating the report
        setTimeout(() => {
            try {
                const htmlString = reportService.generateReport(transactions, period, theme);
                const reportWindow = window.open('', '_blank');
                if (reportWindow) {
                    reportWindow.document.write(htmlString);
                    reportWindow.document.close();
                } else {
                    alert("Please allow pop-ups to view the report.");
                }
            } catch (error) {
                console.error("Failed to generate report:", error);
                alert("Sorry, there was an error generating the report.");
            } finally {
                setIsGenerating(false);
            }
        }, 100);
    };

    return (
        <div className="p-4 space-y-6">
            <div className="animate-screenFadeIn pt-2" style={{ animationDelay: '50ms' }}>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary rounded-full font-medium text-sm disabled:bg-outline"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>
            
            <div className="animate-screenFadeIn" style={{ animationDelay: '150ms' }}>
                <InsightsDashboard period={period} />
            </div>
        </div>
    );
}