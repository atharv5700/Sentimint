import React from 'react';
import type { FinanceTrick } from '../types';

interface FinanceTrickCardProps {
    trick: FinanceTrick;
}

export default function FinanceTrickCard({ trick }: FinanceTrickCardProps) {

    if (!trick) {
        return null;
    }
    
    return (
        <div className="bg-gradient-to-br from-secondary-container/50 to-tertiary-container/50 p-4 rounded-3xl shadow-md relative">
            <div className="flex items-start gap-4">
                <div className="bg-surface/50 rounded-full p-2">
                    <trick.icon className="w-6 h-6 text-on-surface-variant" />
                </div>
                <div className="flex-1">
                    <h3 className="text-title-m font-medium text-on-surface-variant">{trick.title}</h3>
                    <p 
                        className="text-body-m mt-1 text-on-surface-variant/90"
                        dangerouslySetInnerHTML={{ __html: trick.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-on-surface-variant">$1</strong>') }}
                    />
                </div>
            </div>
        </div>
    );
}