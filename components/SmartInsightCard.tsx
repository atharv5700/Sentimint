import React from 'react';
import type { SmartInsight, Screen } from '../types';
import { hapticClick } from '../services/haptics';

interface SmartInsightCardProps {
    insight: SmartInsight;
    setScreen: (screen: Screen) => void;
}

export default function SmartInsightCard({ insight, setScreen }: SmartInsightCardProps) {

    if (!insight) {
        return null;
    }

    const handleAction = () => {
        hapticClick();
        if (insight.action?.type === 'navigate') {
            setScreen(insight.action.payload as Screen);
        }
    };
    
    return (
        <div className="bg-gradient-to-br from-tertiary-container/60 to-primary-container/60 p-4 rounded-3xl shadow-md relative">
            <div className="flex items-start gap-4">
                <div className="bg-surface/50 rounded-full p-2">
                    <insight.icon className="w-6 h-6 text-on-surface-variant" />
                </div>
                <div className="flex-1">
                    <h3 className="text-title-m font-medium text-on-surface-variant">{insight.title}</h3>
                    <p 
                        className="text-body-m mt-1 text-on-surface-variant/90"
                        dangerouslySetInnerHTML={{ __html: insight.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-on-surface-variant">$1</strong>') }}
                    />
                    {insight.action && (
                        <button onClick={handleAction} className="mt-3 text-sm font-medium bg-surface text-on-surface px-3 py-1.5 rounded-full">
                           {insight.action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}