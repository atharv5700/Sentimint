import React, { useRef, useState, useEffect } from 'react';
import { hapticClick } from '../services/haptics';

interface SegmentedControlProps<T extends string> {
    options: { label: string; value: T }[];
    selected: T;
    onSelect: (value: T) => void;
}

export default function SegmentedControl<T extends string>({ options, selected, onSelect }: SegmentedControlProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({});

    useEffect(() => {
        const updatePillStyle = () => {
            const container = containerRef.current;
            if (!container) return;
            
            const selectedIndex = options.findIndex(opt => opt.value === selected);
            if (selectedIndex === -1) return;

            const selectedButton = container.children[selectedIndex + 1] as HTMLElement; // +1 for pill
            if (selectedButton && selectedButton.offsetWidth > 0) {
                setPillStyle({
                    left: `${selectedButton.offsetLeft}px`,
                    width: `${selectedButton.offsetWidth}px`,
                });
            }
        };
        
        // Defer the style calculation until after the browser has painted, ensuring dimensions are available.
        const animationFrameId = requestAnimationFrame(updatePillStyle);
        
        // Also update on resize for responsiveness.
        window.addEventListener('resize', updatePillStyle);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', updatePillStyle);
        };
    }, [selected, options]);

    return (
        <div ref={containerRef} className="relative flex justify-center p-1 bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 rounded-2xl">
            <div 
                className="absolute top-1 bottom-1 bg-primary-container rounded-2xl shadow transition-all duration-300 ease-out"
                style={pillStyle}
            />
            {options.map(({label, value}) => (
                <button
                    key={value}
                    onClick={() => { hapticClick(); onSelect(value); }}
                    className={`relative z-10 w-full capitalize px-4 py-2 text-sm font-medium rounded-2xl transition-colors duration-200 ${
                        selected === value ? 'text-on-primary-container' : 'text-on-surface-variant'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
