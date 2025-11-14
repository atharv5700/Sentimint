import React from 'react';

const EmptyBoxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" {...props}>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20l-4 32h48l-4-32H12z"></path>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M44 20a12 12 0 00-24 0"></path>
    </svg>
);

const EmptySearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" {...props}>
        <circle cx="28" cy="28" r="12" stroke="currentColor" strokeWidth="2"></circle>
        <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M38 38l8 8"></path>
    </svg>
);

const EmptyGoalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" {...props}>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M32 53v-6m-9-30l-5-5m14 5l5-5"></path>
        <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2"></circle>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M32 41a9 9 0 000-18"></path>
    </svg>
);


interface EmptyStateProps {
    icon: 'box' | 'search' | 'goal';
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const ICONS = {
    box: EmptyBoxIcon,
    search: EmptySearchIcon,
    goal: EmptyGoalIcon
};

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
    const IconComponent = ICONS[icon];
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 my-4 bg-surface-variant/50 rounded-3xl animate-screenFadeIn">
            <IconComponent className="w-16 h-16 text-on-surface-variant opacity-50 mb-4" />
            <h3 className="text-title-m font-medium text-on-surface-variant">{title}</h3>
            <p className="max-w-xs mt-1 text-body-m text-on-surface-variant/70">{message}</p>
            {action && (
                <button 
                    onClick={action.onClick}
                    className="mt-6 px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-medium"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
