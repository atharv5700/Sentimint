import type { AppContextType as AppContextTypeExtended } from './App';

export type Screen = 'Home' | 'Transactions' | 'Insights' | 'Goals' | 'Settings';

export type Theme = 'light' | 'dark';

export type Period = 'D' | 'W' | 'M' | 'Y';

export enum Mood {
    Regret = 1,
    NotGreat = 2,
    Neutral = 3,
    Good = 4,
    Happy = 5,
}

export type Transaction = {
    id: string;
    ts: number;
    amount: number;
    currency: 'INR';
    category: string;
    merchant: string;
    mood: Mood;
    note: string;
    tags_json: string; // JSON string of tags array
    goal_id: string | null;
};

export type Goal = {
    id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline_ts: number | null;
    emoji: string;
    created_at: number;
    completed_bool: boolean;
};

export type Budget = {
    id: string;
    category: string;
    amount: number;
    created_at: number;
};

export type MintorAiMessage = {
    id:string;
    text: string;
    sender: 'user' | 'bot';
    actions?: MintorAction[];
};

export type MintorAction = {
    label: string;
    type: 'navigate' | 'function' | 'query';
    payload: string;
};

export interface FabConfig {
    onClick: () => void;
    'aria-label': string;
}

// Re-export the extended type for use in other files
export type AppContextType = AppContextTypeExtended;
