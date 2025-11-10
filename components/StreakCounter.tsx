import React from 'react';
import { FireIcon } from '../constants';

interface StreakCounterProps {
    streak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
    if (streak === 0) return null;

    return (
        <div className="bg-surface-variant/50 text-on-surface-variant px-3 py-1.5 rounded-full text-sm font-medium animate-fabPopIn">
            <span>{streak} Day{streak !== 1 ? 's' : ''} Streak</span>
        </div>
    );
};

export default StreakCounter;