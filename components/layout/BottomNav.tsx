import React from 'react';
import type { Screen } from '../../types';
import { HomeIcon, TransactionsIcon, InsightsIcon, GoalsIcon, SettingsIcon } from '../../constants';
import { hapticClick } from '../../services/haptics';

interface BottomNavProps {
    activeScreen: Screen;
    setScreen: (screen: Screen) => void;
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
    { id: 'Goals', label: 'Goals', icon: GoalsIcon },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav({ activeScreen, setScreen }: BottomNavProps) {
    return (
        <footer 
            className="fixed bottom-0 left-0 right-0 h-20 bg-surface/95 backdrop-blur-lg border-t border-outline-variant z-30"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <nav className="flex justify-around items-center h-full">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            hapticClick();
                            setScreen(item.id);
                        }}
                        className="flex flex-col items-center justify-center w-full h-full gap-0.5"
                        aria-label={item.label}
                        aria-current={activeScreen === item.id ? "page" : undefined}
                    >
                        <div className={`relative flex items-center justify-center rounded-full transition-all duration-300 ease-out ${activeScreen === item.id ? 'bg-secondary-container px-5 py-1' : 'w-16 h-8'}`}>
                           <item.icon className={`w-6 h-6 transition-colors duration-200 ${activeScreen === item.id ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                        </div>
                        <span className={`text-label-s font-medium transition-colors duration-200 ${activeScreen === item.id ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>
        </footer>
    );
}