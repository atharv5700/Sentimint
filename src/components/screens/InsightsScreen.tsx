import React, { useState } from 'react';
import type { Period } from '../../types';
import InsightsDashboard from '../InsightsDashboard';
import SegmentedControl from '../SegmentedControl';

export default function InsightsScreen() {
    const [period, setPeriod] = useState<Period>('M');

    return (
        <div className="px-4 space-y-4">
             <div className="animate-screenFadeIn" style={{ animationDelay: '50ms' }}>
                 <SegmentedControl
                    options={[
                        {label: 'Day', value: 'D'}, 
                        {label: 'Week', value: 'W'},
                        {label: 'Month', value: 'M'},
                        {label: 'Year', value: 'Y'}
                    ]}
                    selected={period}
                    onSelect={(value) => setPeriod(value)}
                />
            </div>
            
            <div className="animate-screenFadeIn" style={{ animationDelay: '150ms' }}>
                <InsightsDashboard period={period} />
            </div>
        </div>
    );
}