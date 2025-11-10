import React, { useRef, useState, useLayoutEffect } from 'react';
import type { Screen } from '../../types';
import { HomeIcon, TransactionsIcon, InsightsIcon, GoalsIcon, SettingsIcon } from '../../constants';
import { hapticClick } from '../../services/haptics';

interface BottomNavProps {
    activeScreen: Screen;
    setScreen: (screen: Screen) => void;
    isBulkMode: boolean;
}

interface NavItem {
    id: Screen;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
    { id: 'Home', label: 'Home', icon: HomeIcon },
    { id: 'Transactions', label: 'Transactions', icon: TransactionsIcon },
    { id: 'Insights', label: 'Insights', icon: InsightsIcon },
    { id: 'Budgets', label: 'Budgets', icon: GoalsIcon },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav({ activeScreen, setScreen, isBulkMode }: BottomNavProps) {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [pillStyle, setPillStyle] = useState({});

    useLayoutEffect(() => {
        const activeIndex = navItems.findIndex(item => item.id === activeScreen);
        const activeButton = buttonRefs.current[activeIndex];

        if (activeButton) {
            setPillStyle({
                width: `${activeButton.offsetWidth}px`,
                transform: `translateX(${activeButton.offsetLeft}px)`,
            });
        }
    }, [activeScreen]);

    return (
        <footer
            className={`fixed bottom-0 left-0 right-0 h-20 bg-surface/80 dark:bg-surface/60 backdrop-blur-lg border-t border-outline-variant/30 z-30 transition-transform duration-300 ease-in-out ${isBulkMode ? 'translate-y-full' : 'translate-y-0'}`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <nav className="grid grid-cols-5 items-center h-full relative px-2">
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-10 bg-secondary-container rounded-full transition-all duration-300 ease-out"
                    style={pillStyle}
                />

                {navItems.map((item, index) => {
                    const isActive = activeScreen === item.id;
                    return (
                        <button
                            key={item.id}
                            ref={el => buttonRefs.current[index] = el}
                            onClick={() => {
                                hapticClick();
                                setScreen(item.id);
                            }}
                            className={`relative z-10 flex items-center justify-center h-full rounded-full transition-all duration-300 ease-out mx-auto ${isActive ? 'flex-row gap-2 px-4' : 'flex-col'}`}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <item.icon className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                            <span 
                                className={`font-medium text-label-s transition-all duration-200 ${isActive ? 'text-on-secondary-container' : 'text-on-surface-variant mt-0.5'}`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </footer>
    );
}