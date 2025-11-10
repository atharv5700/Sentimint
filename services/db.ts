import type { Transaction, Theme, Mood, Budget, RecurringTransaction, UserChallenge } from '../types';

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
    budgets: Budget[];
    recurring_transactions: RecurringTransaction[];
    customCategories: string[];
    userChallenges: UserChallenge[];
    streakData: { currentStreak: number, lastLogDate: string };
}

class DbService {
    private db: Database = {
        transactions: [],
        budgets: [],
        recurring_transactions: [],
        customCategories: [],
        userChallenges: [],
        streakData: { currentStreak: 0, lastLogDate: '' },
    };

    constructor() {
        this.load();
    }
    
    private load() {
        const encryptedData = localStorage.getItem(DB_KEY);
        const data = decrypt<Database>(encryptedData);
        if (data) {
            this.db = {
                transactions: data.transactions || [],
                budgets: data.budgets || [],
                recurring_transactions: data.recurring_transactions || [],
                customCategories: data.customCategories || [],
                userChallenges: data.userChallenges || [],
                streakData: data.streakData || { currentStreak: 0, lastLogDate: '' },
            };
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
            // Inform the user that data could not be saved.
            alert('Critical Error: Could not save data. Your latest changes might be lost. Please check your browser storage permissions and try to free up some space.');
        }
    }

    public async init() {
        if (this.db.transactions.length === 0 && this.db.recurring_transactions.length === 0) {
            console.log("No transactions found, seeding data.");
            await this.seedRecentTransactions();
        }
    }
    
    private async seedRecentTransactions() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        const demoTxs: Omit<Transaction, 'id' | 'ts'>[] = [
            { amount: 350, currency: 'INR', category: 'Food', merchant: 'Swiggy', mood: 4, note: 'Dinner', tags_json: '[]' },
            { amount: 80, currency: 'INR', category: 'Transport', merchant: 'Metro', mood: 3, note: 'Commute', tags_json: '[]' },
            { amount: 1200, currency: 'INR', category: 'Shopping', merchant: 'Myntra', mood: 2, note: 'New Shirt', tags_json: '["impulse"]' },
            { amount: 250, currency: 'INR', category: 'Food', merchant: 'Starbucks', mood: 5, note: 'Coffee meeting', tags_json: '["social"]' },
            { amount: 1500, currency: 'INR', category: 'Groceries', merchant: 'BigBasket', mood: 3, note: 'Weekly stock-up', tags_json: '["planned"]' },
            { amount: 3000, currency: 'INR', category: 'Bills', merchant: 'Airtel', mood: 2, note: 'Internet bill', tags_json: '["planned"]' },
            { amount: 750, currency: 'INR', category: 'Entertainment', merchant: 'PVR Cinemas', mood: 5, note: 'Movie night', tags_json: '["social"]' },
            { amount: 450, currency: 'INR', category: 'Health', merchant: 'Apollo Pharmacy', mood: 3, note: 'Medicines', tags_json: '[]' },
            { amount: 500, currency: 'INR', category: 'Transport', merchant: 'Uber', mood: 3, note: 'Trip to office', tags_json: '[]' },
            { amount: 2200, currency: 'INR', category: 'Shopping', merchant: 'Amazon', mood: 4, note: 'New gadget', tags_json: '["reward"]' },
            { amount: 600, currency: 'INR', category: 'Food', merchant: 'Zomato', mood: 1, note: 'Late night order', tags_json: '["impulse"]' },
            { amount: 950, currency: 'INR', category: 'Other', merchant: 'Gift Store', mood: 5, note: 'Birthday gift', tags_json: '["social"]' },
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

    public async processRecurringTransactions(): Promise<boolean> {
        let changed = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const rTx of this.db.recurring_transactions) {
            let nextDueDate = new Date(rTx.last_added_date || rTx.start_date);
            
            while (nextDueDate.getTime() <= today.getTime()) {
                // If the due date is after the start date, add it
                if (nextDueDate.getTime() >= new Date(rTx.start_date).getTime()) {
                     const newTx: Omit<Transaction, 'id' | 'ts'> = {
                        amount: rTx.amount,
                        currency: rTx.currency,
                        category: rTx.category,
                        merchant: rTx.merchant,
                        mood: rTx.mood,
                        note: rTx.note,
                        tags_json: rTx.tags_json,
                    };
                    const createdTx = {
                        ...newTx,
                        id: `tx-recurring-${rTx.id}-${nextDueDate.getTime()}`,
                        ts: nextDueDate.getTime(),
                    };

                    // Avoid adding duplicates
                    if (!this.db.transactions.some(t => t.id === createdTx.id)) {
                        this.db.transactions.push(createdTx);
                        rTx.last_added_date = nextDueDate.getTime();
                        changed = true;
                    }
                }

                // Calculate next due date
                if (rTx.frequency === 'daily') {
                    nextDueDate.setDate(nextDueDate.getDate() + 1);
                } else if (rTx.frequency === 'weekly') {
                    nextDueDate.setDate(nextDueDate.getDate() + 7);
                } else if (rTx.frequency === 'monthly') {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                } else {
                    break; // Should not happen
                }
            }
        }
        
        if (changed) {
            this.save();
        }
        return changed;
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
        this.updateStreakData(new Date(newTx.ts));
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

    // Recurring Transactions
    public getRecurringTransactions(): RecurringTransaction[] {
        return [...this.db.recurring_transactions].sort((a,b) => a.start_date - b.start_date);
    }

    public async addRecurringTransaction(rTx: Omit<RecurringTransaction, 'id' | 'last_added_date'>): Promise<RecurringTransaction> {
        const newRTx: RecurringTransaction = {
            ...rTx,
            id: `rtx-${Date.now()}`,
            last_added_date: null,
        };
        this.db.recurring_transactions.push(newRTx);
        this.save();
        return newRTx;
    }

    public async updateRecurringTransaction(rTx: RecurringTransaction): Promise<void> {
        const index = this.db.recurring_transactions.findIndex(t => t.id === rTx.id);
        if (index > -1) {
            this.db.recurring_transactions[index] = rTx;
            this.save();
        }
    }

    public async deleteRecurringTransaction(id: string): Promise<void> {
        this.db.recurring_transactions = this.db.recurring_transactions.filter(t => t.id !== id);
        this.save();
    }

    // Budgets
    public getBudgets(): Budget[] {
        return [...this.db.budgets];
    }
    
    public async addBudget(budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> {
        const newBudget: Budget = {
            ...budget,
            id: `budget-${Date.now()}`,
            created_at: Date.now(),
        };
        this.db.budgets.push(newBudget);
        this.save();
        return newBudget;
    }
    
    public async updateBudget(budget: Budget): Promise<void> {
        const index = this.db.budgets.findIndex(b => b.id === budget.id);
        if (index > -1) {
            this.db.budgets[index] = budget;
            this.save();
        }
    }
    
    public async deleteBudget(id: string): Promise<void> {
        this.db.budgets = this.db.budgets.filter(b => b.id !== id);
        this.save();
    }

    // Custom Categories
    public getCustomCategories(): string[] {
        return [...this.db.customCategories];
    }
    
    public async addCustomCategory(category: string): Promise<void> {
        if (!this.db.customCategories.includes(category)) {
            this.db.customCategories.push(category);
            this.save();
        }
    }

    public async deleteCustomCategory(category: string): Promise<void> {
        this.db.customCategories = this.db.customCategories.filter(c => c !== category);
        this.save();
    }
    
    // Challenges
    public getUserChallenges(): UserChallenge[] {
        return [...this.db.userChallenges];
    }

    public async saveUserChallenges(challenges: UserChallenge[]): Promise<void> {
        this.db.userChallenges = challenges;
        this.save();
    }
    
    // Streak
    public getStreakData(): { currentStreak: number, lastLogDate: string } {
        return { ...this.db.streakData };
    }

    private updateStreakData(logDate: Date) {
        const todayStr = logDate.toISOString().split('T')[0];
        
        if (this.db.streakData.lastLogDate === todayStr) {
            return; // Already logged today
        }

        const yesterday = new Date(logDate);
        yesterday.setDate(logDate.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (this.db.streakData.lastLogDate === yesterdayStr) {
            this.db.streakData.currentStreak += 1; // Continue streak
        } else {
            this.db.streakData.currentStreak = 1; // Reset or start streak
        }
        this.db.streakData.lastLogDate = todayStr;
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
        const headers = ['id', 'ts', 'amount', 'currency', 'category', 'merchant', 'mood', 'note', 'tags_json'];
        const rows = this.db.transactions.map(tx => headers.map(header => JSON.stringify(tx[header as keyof Transaction])).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    
    public async deleteAllData(): Promise<void> {
        this.db = {
            transactions: [],
            budgets: [],
            recurring_transactions: [],
            customCategories: [],
            userChallenges: [],
            streakData: { currentStreak: 0, lastLogDate: '' },
        };
        localStorage.removeItem(DB_KEY);
        localStorage.removeItem(THEME_KEY);
        // We can reload to force the app to re-initialize
        window.location.reload();
    }
}

export const dbService = new DbService();