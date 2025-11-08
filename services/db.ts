import type { Transaction, Goal, Theme, Mood } from '../types';

const DB_KEY = 'sentimint_db';
const THEME_KEY = 'sentimint_theme';

// Unicode-safe Base64 encoding. The native btoa function fails on non-Latin1 characters.
const utf8_to_b64 = (str: string): string => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

// Unicode-safe Base64 decoding
const b64_to_utf8 = (str: string): string => {
    return decodeURIComponent(atob(str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

// Simple "encryption" using Base64
const encrypt = (data: object): string => {
    try {
        return utf8_to_b64(JSON.stringify(data));
    } catch (e) {
        console.error("Failed to encrypt data:", e);
        return "";
    }
};
const decrypt = <T,>(data: string | null): T | null => {
    if (!data) return null;
    try {
        return JSON.parse(b64_to_utf8(data)) as T;
    } catch (e) {
        console.error("Failed to decrypt data", e);
        return null;
    }
};

interface Database {
    transactions: Transaction[];
    goals: Goal[];
    // Removed user prefs as it was only used for custom tags
}

class DbService {
    private db: Database = {
        transactions: [],
        goals: [],
    };

    constructor() {
        this.load();
    }
    
    private load() {
        const encryptedData = localStorage.getItem(DB_KEY);
        const data = decrypt<Database>(encryptedData);
        if (data) {
            this.db = data;
        }
    }

    private save() {
        try {
            const encryptedData = encrypt(this.db);
            // Only save if encryption was successful
            if (encryptedData) {
                localStorage.setItem(DB_KEY, encryptedData);
            }
        } catch (e) {
            console.error("Failed to save data to localStorage:", e);
            // Optionally, inform the user that data could not be saved.
        }
    }

    public async init() {
        if (this.db.transactions.length === 0) {
            console.log("No transactions found, seeding data.");
            await this.seedRecentTransactions();
        }
    }
    
    private async seedRecentTransactions() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        const demoTxs: Omit<Transaction, 'id' | 'ts'>[] = [
            { amount: 350, currency: 'INR', category: 'Food', merchant: 'Swiggy', mood: 4, note: 'Dinner', tags_json: '[]', goal_id: null },
            { amount: 80, currency: 'INR', category: 'Transport', merchant: 'Metro', mood: 3, note: 'Commute', tags_json: '[]', goal_id: null },
            { amount: 1200, currency: 'INR', category: 'Shopping', merchant: 'Myntra', mood: 2, note: 'New Shirt', tags_json: '["impulse"]', goal_id: null },
            { amount: 250, currency: 'INR', category: 'Food', merchant: 'Starbucks', mood: 5, note: 'Coffee meeting', tags_json: '["social"]', goal_id: null },
            { amount: 1500, currency: 'INR', category: 'Groceries', merchant: 'BigBasket', mood: 3, note: 'Weekly stock-up', tags_json: '["planned"]', goal_id: null },
            { amount: 3000, currency: 'INR', category: 'Bills', merchant: 'Airtel', mood: 2, note: 'Internet bill', tags_json: '["planned"]', goal_id: null },
            { amount: 750, currency: 'INR', category: 'Entertainment', merchant: 'PVR Cinemas', mood: 5, note: 'Movie night', tags_json: '["social"]', goal_id: null },
            { amount: 450, currency: 'INR', category: 'Health', merchant: 'Apollo Pharmacy', mood: 3, note: 'Medicines', tags_json: '[]', goal_id: null },
            { amount: 500, currency: 'INR', category: 'Transport', merchant: 'Uber', mood: 3, note: 'Trip to office', tags_json: '[]', goal_id: null },
            { amount: 2200, currency: 'INR', category: 'Shopping', merchant: 'Amazon', mood: 4, note: 'New gadget', tags_json: '["reward"]', goal_id: null },
            { amount: 600, currency: 'INR', category: 'Food', merchant: 'Zomato', mood: 1, note: 'Late night order', tags_json: '["impulse"]', goal_id: null },
            { amount: 950, currency: 'INR', category: 'Other', merchant: 'Gift Store', mood: 5, note: 'Birthday gift', tags_json: '["social"]', goal_id: null },
        ];

        this.db.transactions = []; // Clear any previous seed data
        
        demoTxs.forEach((tx, i) => {
            // Distribute transactions throughout the current month
            const day = Math.max(1, Math.floor(Math.random() * (today.getDate() - 1)));
            const date = new Date(today.getFullYear(), today.getMonth(), day);
            date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const newTx: Transaction = {
                ...tx,
                id: `seed-recent-${i}`,
                ts: date.getTime(),
            };
            this.db.transactions.push(newTx);
        });
        
        // Sort transactions by date descending after seeding
        this.db.transactions.sort((a,b) => b.ts - a.ts);
        this.save();
    }


    // Transactions
    public getTransactions(): Transaction[] {
        return [...this.db.transactions].sort((a,b) => b.ts - a.ts);
    }
    
    public async addTransaction(tx: Omit<Transaction, 'id' | 'ts'>): Promise<Transaction> {
        const newTx: Transaction = {
            ...tx,
            id: `tx-${Date.now()}`,
            ts: Date.now(),
        };
        this.db.transactions.push(newTx);
        this.save();
        return newTx;
    }
    
    public async updateTransaction(tx: Transaction): Promise<void> {
        const index = this.db.transactions.findIndex(t => t.id === tx.id);
        if (index > -1) {
            this.db.transactions[index] = tx;
            this.save();
        }
    }
    
    public async deleteTransaction(id: string): Promise<void> {
        this.db.transactions = this.db.transactions.filter(t => t.id !== id);
        this.save();
    }

    public async deleteTransactions(ids: string[]): Promise<void> {
        this.db.transactions = this.db.transactions.filter(t => !ids.includes(t.id));
        this.save();
    }

    // Goals
    public getGoals(): Goal[] {
        return [...this.db.goals];
    }
    
    public async addGoal(goal: Omit<Goal, 'id' | 'created_at' | 'current_amount' | 'completed_bool'>): Promise<Goal> {
        const newGoal: Goal = {
            ...goal,
            id: `goal-${Date.now()}`,
            created_at: Date.now(),
            current_amount: 0,
            completed_bool: false,
        };
        this.db.goals.push(newGoal);
        this.save();
        return newGoal;
    }
    
    public async updateGoal(goal: Goal): Promise<void> {
        const index = this.db.goals.findIndex(g => g.id === goal.id);
        if (index > -1) {
            this.db.goals[index] = goal;
            this.save();
        }
    }
    
    public async deleteGoal(id: string): Promise<void> {
        this.db.goals = this.db.goals.filter(g => g.id !== id);
        this.save();
    }

    // Theme
    public getTheme(): Theme {
        const theme = localStorage.getItem(THEME_KEY) as Theme | null;
        if (theme) return theme;
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    public setTheme(theme: Theme) {
        localStorage.setItem(THEME_KEY, theme);
    }
    
    // Data Management
    public exportToCsv(): string {
        const headers = ['id', 'ts', 'amount', 'currency', 'category', 'merchant', 'mood', 'note', 'tags_json', 'goal_id'];
        const rows = this.db.transactions.map(tx => headers.map(header => JSON.stringify(tx[header as keyof Transaction])).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    
    public async deleteAllData(): Promise<void> {
        this.db = {
            transactions: [],
            goals: [],
        };
        localStorage.removeItem(DB_KEY);
    }
}

export const dbService = new DbService();