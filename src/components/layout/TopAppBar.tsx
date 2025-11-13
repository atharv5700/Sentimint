import React, { forwardRef } from 'react';
import { SearchIcon, MintorAiIcon } from '../../constants';
import { hapticClick } from 'services/haptics';

interface TopAppBarProps {
    onMintorClick: () => void;
    onSearchClick: () => void;
}

const TopAppBar = forwardRef<HTMLElement, TopAppBarProps>(({ onMintorClick, onSearchClick }, ref) => {
    return (
        <header
            ref={ref}
            className="flex items-center justify-between px-4 pb-3 backdrop-blur-lg sticky top-0 left-0 right-0 z-20 border-b border-outline-variant/30 will-change-transform"
            style={{ 
                paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
                background: 'var(--top-app-bar-bg)'
            }}
        >
            <div className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">Senti</span>
                <span className="text-on-surface-variant [text-shadow:_0_0_10px_rgb(var(--color-surface-variant)/0.3)] [-webkit-text-stroke:_0.5px_rgb(var(--color-outline-variant)/0.5)]">mint</span>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        hapticClick();
                        onSearchClick();
                    }}
                    className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant bg-surface-variant/30 backdrop-blur-sm border border-outline-variant/30 hover:bg-surface-variant/50 transition-colors"
                    aria-label="Search"
                >
                    <SearchIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={() => {
                        hapticClick();
                        onMintorClick();
                    }}
                    className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant bg-surface-variant/30 backdrop-blur-sm border border-outline-variant/30 hover:bg-surface-variant/50 transition-colors"
                    aria-label="Open Mintor AI"
                >
                    <MintorAiIcon className="w-10 h-10 text-primary dark:text-on-secondary" />
                </button>
            </div>
        </header>
    );
});

export default TopAppBar;