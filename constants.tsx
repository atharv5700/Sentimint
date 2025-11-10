import React from 'react';
import type { Mood } from './types';

export const DEFAULT_CATEGORIES = [
    'Food', 'Groceries', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Travel', 'Other'
];

export const DEFAULT_TAGS = ['impulse', 'planned', 'social', 'reward'];

// MD3 Monotone Icons as React Components
const iconProps = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className: "w-6 h-6"
};

// Smart Insight Icons
export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...iconProps} {...props}><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" /></svg>);
export const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...iconProps} {...props}><path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" /></svg>);
export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...iconProps} {...props}><path d="M20.5,2H19L15,8V12C15,13.1 14.1,14 13,14H9C7.9,14 7,13.1 7,12V8L3,2H1.5L2,2C3.1,2 4,2.9 4,4V12C4,14.21 5.79,16 8,16H9V20H13V16H14C16.21,16 18,14.21 18,12V4C18,2.9 18.9,2 20,2L20.5,2M4,18H8V22H4V18M14,18H18V22H14V18Z" /></svg>);
export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...iconProps} {...props}><path d="M12,2C8.69,2 6,4.69 6,8C6,10.28 7.21,12.26 9,13.24V15C9,15.55 9.45,16 10,16H14C14.55,16 15,15.55 15,15V13.24C16.79,12.26 18,10.28 18,8C18,4.69 15.31,2 12,2M10,18C10,18.94 10.63,19.75 11.5,19.95V22H12.5V19.95C13.37,19.75 14,18.94 14,18H10Z" /></svg>);


export const SentimintLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect x="2" y="2" width="236" height="76" rx="8" fill="none" stroke="rgb(var(--color-primary-container))" strokeWidth="4" />
        <rect x="8" y="8" width="112" height="64" fill="rgb(var(--color-primary-container))" />
        <rect x="120" y="8" width="112" height="64" fill="rgb(var(--color-on-primary-container))" />
        <text 
            x="64" 
            y="52" 
            fontFamily="Roboto, sans-serif" 
            fontSize="32" 
            fontWeight="bold" 
            fill="rgb(var(--color-on-primary-container))" 
            textAnchor="middle"
            letterSpacing="2"
        >
            SENTI
        </text>
        <text 
            x="176" 
            y="52" 
            fontFamily="Roboto, sans-serif" 
            fontSize="32" 
            fontWeight="bold" 
            fill="rgb(var(--color-primary-container))" 
            textAnchor="middle"
            letterSpacing="2"
        >
            MINT
        </text>
    </svg>
);


export const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M12 3 3 10v11h6v-7h6v7h6V10z"/></svg>
);

export const TransactionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
);

export const InsightsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M4 9h4v11H4V9zm6-5h4v16h-4V4zm6 8h4v8h-4v-8z"/></svg>
);

export const GoalsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21H9Z"/></svg>
);

export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
);

// Mood Icons - Monochrome Emojis
const MoodRegretIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 15C15 14 14.1 13.5 12 13.5C9.9 13.5 9 14 8.5 15" />
        <circle cx="9" cy="10" r="0.5" fill="currentColor" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </svg>
);
const MoodUnsureIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15H16" transform="rotate(-5 12 15)" />
        <circle cx="9" cy="10" r="0.5" fill="currentColor" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </svg>
);
const MoodNeutralIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15H15" />
        <circle cx="9" cy="10" r="0.5" fill="currentColor" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </svg>
);
const MoodGoodIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5C9 15.5 10.5 16.5 12 16.5C13.5 16.5 15 15.5 15.5 14.5" />
        <circle cx="9" cy="10" r="0.5" fill="currentColor" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </svg>
);
const MoodHappyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14C8.5 16 10 17 12 17C14 17 15.5 16 16 14H8Z" fill="currentColor"/>
        <circle cx="9" cy="10" r="0.5" fill="currentColor" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" />
    </svg>
);

export const MOOD_MAP: Record<Mood, { label: string; color: string; icon: React.FC<any> }> = {
    [1]: { label: 'Regret', color: 'text-red-500', icon: MoodRegretIcon },
    [2]: { label: 'Unsure', color: 'text-amber-500', icon: MoodUnsureIcon },
    [3]: { label: 'Neutral', color: 'text-slate-500', icon: MoodNeutralIcon },
    [4]: { label: 'Good', color: 'text-teal-500', icon: MoodGoodIcon },
    [5]: { label: 'Happy', color: 'text-emerald-500', icon: MoodHappyIcon },
};


export const MINTOR_AI_ASSISTANT = {
    name: 'Mintor AI',
};

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
);

export const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3H19C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" /></svg>
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
);

export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M9,20.42L2.79,14.21L4.21,12.79L9,17.58L19.79,6.79L21.21,8.21L9,20.42Z" /></svg>
);

export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
);

export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>
);

export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z" /></svg>
);

export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.59,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z" /></svg>
);

export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7C4.24,7 2,9.24 2,12C2,14.76 4.24,17 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17C19.76,17 22,14.76 22,12C22,9.24 19.76,7 17,7Z" /></svg>
);

export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" /></svg>
);

export const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M12,2.6L9.3,9.3L2.6,12L9.3,14.7L12,21.4L14.7,14.7L21.4,12L14.7,9.3L12,2.6M22,20L20.5,16.5L17,15L20.5,13.5L22,10L23.5,13.5L27,15L23.5,16.5L22,20Z" /></svg>
);

export const MintorAiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11.5" stroke="rgb(var(--color-primary-container))" strokeWidth="1" />
        <text 
            x="12" 
            y="13" 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize="9" 
            fontWeight="bold" 
            fill="rgb(var(--color-on-primary))" 
            style={{fontFamily: 'Roboto, sans-serif', userSelect: 'none'}}
        >
            AI
        </text>
    </svg>
);


export const RecurringIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4M12,18C8.69,18 6,15.31 6,12C6,8.69 8.69,6 12,6C15.31,6 18,8.69 18,12C18,15.31 15.31,18 12,18M12.5,12.5L15.3,14.2L14.5,15.5L11,13.3V7H12.5V12.5Z" /></svg>
);

export const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...iconProps} {...props}><path d="M13.5,0.67C13.5,0.67 13.13,2.44 14.33,3.64C15.54,4.84 17.3,4.5 17.3,4.5C17.3,4.5 18.1,7.17 16,9.17C13.9,11.17 12.5,12 12.5,12C12.5,12 11.1,11.17 9,9.17C6.9,7.17 7.67,4.5 7.67,4.5C7.67,4.5 9.43,4.84 10.64,3.64C11.84,2.44 11.5,0.67 11.5,0.67H13.5M11,13.17C11,13.17 6,16.17 6,20.17C6,22.17 7.5,24 12,24C16.5,24 18,22.17 18,20.17C18,16.17 13,13.17 13,13.17" /></svg>
);

const WalletOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...iconProps} {...props}><path d="M20.1,6H6.2L4.6,4.4C4.8,4.3 5,4.2 5.2,4.1L20.1,19L21.5,17.6L2.4,0.5L1,1.9L2.1,3H4C3.4,3 3,3.4 3,4V18C3,18.6 3.4,19 4,19H18C18.1,19 18.3,19 18.4,18.9L20.5,21L21.9,19.6L3.5,1.2L2.1,2.6L18.1,18.6C18,18.8 17.8,18.9 17.6,18.9C18.4,18.3 19.3,17.2 20.1,16C19.7,15.6 19.2,15.3 18.7,15C19.2,14.7 19.7,14.4 20.1,14C19,12.5 17,11.4 15.1,11.1L12.1,8.1C12.4,8.1 12.8,8 13,8H20C20.6,8 21,7.6 21,7C21,6.4 20.6,6 20,6M18.8,10.1C17.5,10.4 16.3,11.1 15.3,12L13.1,9.8C14.7,9.3 16.5,9 18.3,9H20V7.8L18.8,10.1M9.2,6L7.2,4H20V6H9.2Z" /></svg>);
const CoffeeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...iconProps} {...props}><path d="M2.3,1.3L1,2.6L4.4,6H4C2.9,6 2,6.9 2,8V10C2,10.7 2.3,11.4 2.8,11.8L7.1,16.1L6,17.2V19H16.1L20.8,23.7L22.1,22.4L2.3,1.3M8,17.2L6.8,16H5.6L10,11.6V8H8V10H6V8C6,7.4 6.4,7 7,7H10.1L8.8,5.7L8.1,5H18C19.1,5 20,5.9 20,7V11.9L18,9.9V7H16V9H14V7H12V7.1L10.8,5.9L10.1,5.2L12,3.3C12,3.3 15,3.3 15,5.3C15,7.3 12,7.3 12,7.3V11.3L8,15.3V17.2Z" /></svg>);
const PiggyBankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...iconProps} {...props}><path d="M18.6,12.3C18.9,12.1 19,11.8 19,11.4V10.7C19,9.8 18.3,9 17.3,9H16V7C16,5.9 15.1,5 14,5H10C8.9,5 8,5.9 8,7V9H5.8C5.3,9 5,9.3 5,9.8V10.2C5,10.7 5.3,11 5.8,11H8V12H7C5.9,12 5,12.9 5,14V18C5,19.1 5.9,20 7,20H17.2C18.2,20 19,19.2 19,18.2V16.7C19,15.8 18.3,15 17.3,15H16V13H17.3C17.8,13 18.2,12.7 18.6,12.3M10,7H14V9H10V7Z" /></svg>);
// Fix: Added export to CalendarCheckIcon to resolve import error in WeeklyDigest.tsx.
export const CalendarCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...iconProps} {...props}><path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.89 20.1,3 19,3H18V1M10.9,13.08L16.5,7.5L17.9,8.9L10.9,15.9L6.4,11.4L7.8,9.9L10.9,13.08Z" /></svg>);
const FastFoodOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg {...iconProps} {...props}><path d="M20.8,22.2L1.6,3L2.8,1.8L22,21L20.8,22.2M11,17V15H13V17H11M8,11H6.2L4.2,9H8V11M16.2,11L14.2,9H12.2L9.2,6H16L19,9H17.2L20.2,12H18L15.9,14H8.1L6.1,12H2V14H4.1L8.3,18.2C8.7,19.2 9.7,20 11,20C12.3,20 13.5,19.1 13.8,17.9L14.2,16H15L17.1,18.1L18.5,16.7L16,14.2V11.8L16.2,11Z" /></svg>);

export const CHALLENGE_BADGE_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'default': TrophyIcon,
    'wallet-off': WalletOffIcon,
    'coffee-off': CoffeeOffIcon,
    'piggy-bank': PiggyBankIcon,
    'calendar-check': CalendarCheckIcon,
    'fast-food-off': FastFoodOffIcon,
};