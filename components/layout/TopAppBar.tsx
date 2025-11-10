import React from 'react';
import { SearchIcon, MintorAiIcon } from '../../constants';
import { hapticClick } from '../../services/haptics';

interface TopAppBarProps {
    onMintorClick: () => void;
    onSearchClick: () => void;
}

export default function TopAppBar({ onMintorClick, onSearchClick }: TopAppBarProps) {
    return (
        <header 
            className="flex items-center justify-between px-4 pb-3 backdrop-blur-lg sticky top-0 z-20 border-b border-outline-variant/30 will-change-transform"
            style={{ 
                paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
                background: 'var(--top-app-bar-bg)'
            }}
        >
            <h1 className="text-headline-m font-bold tracking-tight relative top-0.5">
                <span className="text-primary">Senti</span>
                <span className="text-on-surface-variant">mint</span>
            </h1>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        hapticClick();
                        onSearchClick();
                    }}
                    className="flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant bg-surface-variant/30 backdrop-blur-sm border border-outline-variant/30 hover:bg-surface-variant/50 transition-colors"
                    aria-label="Search"
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => {
                        hapticClick();
                        onMintorClick();
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant bg-surface-variant/30 backdrop-blur-sm border border-outline-variant/30 hover:bg-surface-variant/50 transition-colors"
                    aria-label="Open Mintor AI"
                >
                    <MintorAiIcon className="w-9 h-9 text-primary dark:text-on-secondary" />
                </button>
            </div>
        </header>
    );
}