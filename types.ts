import React from 'react';

// Consolidated Capacitor Plugin type definitions to resolve conflicts across files.
// This single global declaration ensures all used plugins are available type-wise.
declare global {
  interface Window {
    Capacitor?: {
      isPluginAvailable: (name: string) => boolean;
      Plugins: {
        App?: {
          addListener: (eventName: 'backButton', listenerFunc: (e: { canGoBack: boolean; }) => void) => { remove: () => void; };
          minimizeApp: () => Promise<void>;
        };
        Preferences?: {
          get: (options: { key: string; }) => Promise<{ value: string | null; }>;
          set: (options: { key: string; value: string; }) => Promise<void>;
          remove: (options: { key: string; }) => Promise<void>;
        };
        Network?: {
          getStatus: () => Promise<{ connected: boolean; connectionType: string; }>;
        };
        Haptics?: {
          impact: (options: { style: 'light' | 'medium' | 'heavy' }) => void;
          notification: (options: { type: 'success' | 'warning' | 'error' }) => void;
        };
        [key: string]: any;
      }
    };
  }
}

export type Screen = 'Home' | 'Ledger' | 'Insights' | 'Budgets' | 'Settings';

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
};

export type RecurringTransaction = Omit<Transaction, 'id' | 'ts'> & {
    id: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    start_date: number; // timestamp
    last_added_date: number | null; // timestamp
    title: string;
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

export type CoachingTip = {
    id: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    text: string;
    action?: MintorAction;
};

export type FinanceTrick = {
    id: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    text: string;
};

export type Quote = {
    text: string;
    author: string;
};


export type ChallengeType = 'noSpendOnCategory' | 'spendLimitOnCategory';
export type ChallengeStatus = 'active' | 'completed' | 'failed';

export type Challenge = {
    id: string;
    title: string;
    description: string;
    type: ChallengeType;
    durationDays: number;
    targetValue: number;
    category?: string;
    badgeIcon: string;
};

export type UserChallenge = {
    challengeId: string;
    startDate: number;
    status: ChallengeStatus;
    progress: number;
    endDate?: number;
};

type KBEntry = {
    keywords: string[];
    answer?: string;
    answers?: string[];
};

export type KnowledgeBase = {
    greetingsAndChitChat: Record<string, KBEntry>;
    financeGeneral: Record<string, KBEntry>;
    howToApp: Record<string, KBEntry>;
    appAbout: Record<string, KBEntry>;
    savingTips: { general: string[] };
};

export interface AppContextType {
  transactions: Transaction[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  customCategories: string[];
  userChallenges: UserChallenge[];
  streak: number;
  theme: Theme;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: Theme) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'ts'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  importTransactions: (txs: Omit<Transaction, 'id'>[]) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurringTransaction: (rTx: Omit<RecurringTransaction, 'id' | 'last_added_date'>) => Promise<void>;
  updateRecurringTransaction: (rTx: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  addCustomCategory: (category: string) => Promise<void>;
  deleteCustomCategory: (category: string) => Promise<void>;
  startChallenge: (challengeId: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  isBulkMode: boolean;
  setIsBulkMode: (isBulk: boolean) => void;
  setFabConfig: (config: FabConfig | null) => void;
  openTransactionModal: (tx?: Transaction | null) => void;
  openBudgetModal: (budget?: Budget | null) => void;
  openRecurringTransactionModal: (rTx?: RecurringTransaction | null) => void;
  openImportModal: () => void;
  openExportModal: () => void;
  openManageCategoriesModal: () => void;
  refreshData: () => Promise<void>;
}