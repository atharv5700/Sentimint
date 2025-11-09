import React from 'react';

interface StreakCounterProps {
    streak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
    if (streak === 0) return null;

    return (
        <div className="flex items-center justify-center bg-surface text-on-surface px-3 py-1.5 rounded-full text-sm animate-fabPopIn">
            <span className="font-medium">{streak} Day Streak</span>
        </div>
    );
};

export default StreakCounter;
