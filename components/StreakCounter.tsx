import React from 'react';
import { FireIcon } from '../constants';

interface StreakCounterProps {
    streak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
    if (streak === 0) return null;

    return (
        <div className="bg-surface-variant/40 backdrop-blur-sm border border-outline/10 text-on-surface-variant px-3 py-1.5 rounded-2xl text-sm font-medium animate-fabPopIn flex items-center gap-1">
            <FireIcon className="w-4 h-4 text-coral-DEFAULT" />
            <span>{streak} Day{streak !== 1 ? 's' : ''}</span>
        </div>
    );
};

export default StreakCounter;