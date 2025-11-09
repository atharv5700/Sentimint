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
    <svg {...iconProps} {...props}><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
);

// Moods represented by letters in a scalable SVG
const MoodLetterSvg: React.FC<{ letter: string } & React.SVGProps<SVGSVGElement>> = ({ letter, ...props }) => (
    <svg {...props} viewBox="0 0 24 24">
        <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fontFamily="sans-serif"
            fill="currentColor"
        >
            {letter}
        </text>
    </svg>
);

export const MOOD_MAP: Record<Mood, { label: string; emoji: string; color: string; icon: React.FC<any> }> = {
    [1]: { label: 'Regret', emoji: 'R', color: 'text-[#EF4444]', icon: (props) => <MoodLetterSvg letter="R" {...props} /> },
    [2]: { label: 'Unsure', emoji: 'U', color: 'text-[#FB923C]', icon: (props) => <MoodLetterSvg letter="U" {...props} /> },
    [3]: { label: 'Neutral', emoji: 'N', color: 'text-[#9CA3AF]', icon: (props) => <MoodLetterSvg letter="N" {...props} /> },
    [4]: { label: 'Good', emoji: 'G', color: 'text-[#34D399]', icon: (props) => <MoodLetterSvg letter="G" {...props} /> },
    [5]: { label: 'Happy', emoji: 'H', color: 'text-[#22C55E]', icon: (props) => <MoodLetterSvg letter="H" {...props} /> },
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