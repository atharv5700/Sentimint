import { useState, useEffect } from 'react';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const useAnimatedCounter = (endValue: number, duration: number = 1000) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const startValue = count; 
        const range = endValue - startValue;
        let startTime: number | null = null;

        if (range === 0) {
            setCount(endValue);
            return;
        }

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const relativeProgress = Math.min(progress / duration, 1);
            const easedProgress = easeOutCubic(relativeProgress);
            
            const currentVal = startValue + range * easedProgress;
            setCount(currentVal);

            if (progress < duration) {
                requestAnimationFrame(step);
            } else {
                setCount(endValue);
            }
        };

        const animationFrameId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(animationFrameId);
    }, [endValue, duration]);

    return count;
};
