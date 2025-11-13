import React, { useState, useRef, useCallback } from 'react';

const PULL_THRESHOLD = 80; // pixels
const PULL_MAX = 120; // pixels for visual feedback

export const usePullToAdd = (onTrigger: () => void) => {
    const [pullPosition, setPullPosition] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const touchStartRef = useRef<{ y: number, scrollTop: number } | null>(null);

    const reset = () => {
        setIsPulling(false);
        setPullPosition(0);
        touchStartRef.current = null;
    };

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop === 0) {
            touchStartRef.current = { y: e.touches[0].clientY, scrollTop: target.scrollTop };
        } else {
            touchStartRef.current = null;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
        if (!touchStartRef.current) return;

        const deltaY = e.touches[0].clientY - touchStartRef.current.y;
        
        if (deltaY > 0) {
            // Prevent default scroll behavior when pulling down from the top
            e.preventDefault();
            setIsPulling(true);
            const pullDistance = Math.min(deltaY, PULL_MAX);
            setPullPosition(pullDistance);
        } else {
            reset();
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!touchStartRef.current || !isPulling) return;

        if (pullPosition >= PULL_THRESHOLD) {
            onTrigger();
        }
        
        reset();
    }, [pullPosition, isPulling, onTrigger]);
    
    const pullProgress = Math.min(pullPosition / PULL_THRESHOLD, 1);

    return {
        isPulling,
        pullPosition,
        pullProgress,
        touchHandlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchEnd,
        }
    };
};