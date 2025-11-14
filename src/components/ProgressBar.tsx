import React from 'react';

interface ProgressBarProps {
    progress: number; // 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    const safeProgress = Math.max(0, Math.min(100, progress));
    const color = safeProgress > 90 ? 'bg-error' : safeProgress > 70 ? 'bg-coral-DEFAULT' : 'bg-primary';
    
    return (
        <div className="w-full bg-outline-variant/50 rounded-full h-2.5">
            <div 
                className={`${color} h-2.5 rounded-full transition-all duration-500`} 
                style={{ width: `${safeProgress}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
