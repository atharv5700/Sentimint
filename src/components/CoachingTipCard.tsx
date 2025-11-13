import React from 'react';
import type { CoachingTip, Screen } from '../types';
import { hapticClick } from 'services/haptics';

interface CoachingTipCardProps {
    tip: CoachingTip;
    setScreen: (screen: Screen) => void;
}

export default function CoachingTipCard({ tip, setScreen }: CoachingTipCardProps) {

    if (!tip) {
        return null;
    }

    const handleAction = () => {
        hapticClick();
        if (tip.action?.type === 'navigate') {
            setScreen(tip.action.payload as Screen);
        }
    };
    
    return (
        <div className="bg-gradient-to-br from-tertiary-container/60 to-primary-container/60 p-4 rounded-3xl shadow-md relative transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
            <div className="flex items-start gap-4">
                <div className="bg-surface/50 rounded-full p-2">
                    <tip.icon className="w-6 h-6 text-on-surface-variant" />
                </div>
                <div className="flex-1">
                    <h3 className="text-title-m font-medium text-on-surface-variant">{tip.title}</h3>
                    <p 
                        className="text-body-m mt-1 text-on-surface-variant/90"
                        dangerouslySetInnerHTML={{ __html: tip.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-on-surface-variant">$1</strong>') }}
                    />
                    {tip.action && (
                        <button onClick={handleAction} className="mt-3 text-sm font-medium bg-surface text-on-surface px-3 py-1.5 rounded-full">
                           {tip.action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}