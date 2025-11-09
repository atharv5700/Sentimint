import React from 'react';
import { PlusIcon } from '../constants';

interface PullToAddIndicatorProps {
    isPulling: boolean;
    pullProgress: number; // 0 to 1
}

const PullToAddIndicator: React.FC<PullToAddIndicatorProps> = ({ isPulling, pullProgress }) => {
    const iconScale = 0.8 + pullProgress * 0.4; // Scale from 0.8 to 1.2
    const iconOpacity = Math.min(pullProgress * 1.5, 1);
    const rotation = pullProgress * 135;

    return (
        <div 
            className="absolute top-0 left-0 right-0 flex justify-center pt-5 pointer-events-none transition-opacity duration-300"
            style={{ 
                opacity: isPulling ? 1 : 0,
                transform: `translateY(-100%)`, // Positioned off-screen
            }}
            aria-hidden="true"
        >
            <div
                className="w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-lg"
                style={{
                    transform: `scale(${iconScale})`,
                    opacity: iconOpacity,
                }}
            >
                <PlusIcon 
                    className="w-7 h-7 transition-transform duration-200"
                    style={{ transform: `rotate(${rotation}deg)` }}
                />
            </div>
        </div>
    );
};

export default PullToAddIndicator;
