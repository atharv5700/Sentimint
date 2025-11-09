import React from 'react';
import { SentimintLogo, SearchIcon, MintorAiIcon } from '../../constants';
import { hapticClick } from '../../services/haptics';

interface TopAppBarProps {
    onMintorClick: () => void;
    onSearchClick: () => void;
}

export default function TopAppBar({ onMintorClick, onSearchClick }: TopAppBarProps) {
    return (
        <header 
            className="flex items-center justify-between px-4 pb-3 bg-surface shadow-md sticky top-0 z-20"
            style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
        >
            <SentimintLogo className="h-8 text-on-surface"/>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        hapticClick();
                        onSearchClick();
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                    aria-label="Search"
                >
                    <SearchIcon className="w-7 h-7" />
                </button>
                <button
                    onClick={() => {
                        hapticClick();
                        onMintorClick();
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                    aria-label="Open Mintor AI"
                >
                    <MintorAiIcon className="w-9 h-9 text-primary" />
                </button>
            </div>
        </header>
    );
}