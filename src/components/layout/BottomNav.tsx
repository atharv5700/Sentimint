import React, { useRef, useState, useEffect, forwardRef } from 'react';
// FIX: Changed import paths to be relative
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
    { id: 'Ledger', label: 'Ledger', icon: TransactionsIcon },
    { id: 'Insights', label: 'Insights', icon: InsightsIcon },
    { id: 'Budgets', label: 'Budgets', icon: GoalsIcon },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon },
];

const BottomNav = forwardRef<HTMLElement, BottomNavProps>(({ activeScreen, setScreen, isBulkMode }, ref) => {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [pillStyle, setPillStyle] = useState({});

    useEffect(() => {
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
            ref={ref}
            className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-lg border-t border-outline-variant/30 transition-transform duration-300 ease-in-out ${isBulkMode ? 'translate-y-full' : 'translate-y-0'}`}
            style={{ 
                background: 'var(--bottom-nav-bg)',
                paddingBottom: 'env(safe-area-inset-bottom)' 
            }}
        >
            <nav
                className="grid grid-cols-5 items-stretch h-20 relative px-4"
            >
                <div
                    className="absolute top-3 h-14 bg-secondary-container rounded-2xl transition-all duration-300 ease-out"
                    style={pillStyle}
                />

                {navItems.map((item, index) => {
                    const isActive = activeScreen === item.id;
                    return (
                        <button
                            key={item.id}
                            // FIX: The ref callback should not return a value. Using braces to ensure an implicit return is not made.
                            ref={el => { buttonRefs.current[index] = el; }}
                            onClick={() => {
                                hapticClick();
                                setScreen(item.id);
                            }}
                            className={`relative z-10 flex flex-col items-center justify-center h-full w-full`}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <item.icon className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                            <span 
                                className={`font-medium text-label-s mt-0.5 transition-colors duration-200 ${isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </footer>
    );
});

export default BottomNav;