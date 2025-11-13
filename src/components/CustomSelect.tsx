import React, { useState, useRef, useEffect } from 'react';
// FIX: Updated import path to be relative.
import { ChevronDownIcon } from '../constants';

type Option = {
    value: string | number;
    label: string;
};

interface CustomSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(opt => opt.value === value)?.label || options[0]?.label;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSelect = (newValue: string | number) => {
        onChange(newValue);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 text-on-surface-variant rounded-xl py-3 px-4 text-left focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 flex justify-between items-center"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDownIcon className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`absolute top-full mt-2 w-full bg-surface shadow-lg rounded-2xl z-20 overflow-hidden origin-top transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                 <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
                    {options.map(option => (
                        <li
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            role="option"
                            aria-selected={value === option.value}
                            className={`p-3 text-sm rounded-lg cursor-pointer ${value === option.value ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-variant'}`}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CustomSelect;