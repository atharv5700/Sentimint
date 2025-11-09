import React from 'react';
import { MINTOR_AI_ASSISTANT, SentimintLogo } from '../../constants';
import { hapticClick } from '../../services/haptics';

interface TopAppBarProps {
    onMintorClick: () => void;
}

export default function TopAppBar({ onMintorClick }: TopAppBarProps) {
    return (
        <header 
            className="flex items-center justify-between px-4 pb-3 bg-surface shadow-md sticky top-0 z-20"
            style={{ paddingTop: `calc(1.25rem + env(safe-area-inset-top))` }}
        >
            <SentimintLogo className="h-8 text-on-surface"/>
            
            <button
                onClick={() => {
                    hapticClick();
                    onMintorClick();
                }}
                className="flex items-center gap-2 bg-surface-variant text-on-surface-variant px-3 h-8 rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium border border-primary"
            >
                <span>{MINTOR_AI_ASSISTANT.name}</span>
            </button>
        </header>
    );
}