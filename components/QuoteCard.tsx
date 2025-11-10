import React from 'react';
import type { Quote } from '../types';

export default function QuoteCard({ quote }: { quote: Quote }) {
    if (!quote) {
        return null;
    }
    
    return (
        <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-2 text-center">
            <p className="text-body-m font-medium text-on-surface-variant">"{quote.text}"</p>
            <p className="text-label-s text-on-surface-variant/80">- {quote.author}</p>
        </div>
    );
}