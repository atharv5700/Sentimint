import type { Transaction, Theme, Mood, Budget, RecurringTransaction, UserChallenge } from '../types';

/**
 * For native builds, this service now prioritizes the Capacitor Preferences plugin
 * for robust and performant key-value storage.
 * It gracefully falls back to localStorage for web environments.
 */

const DB_KEY = 'sentimint_db';
const THEME_KEY = 'sentimint_theme';

const canUseStorage = () => window.Capacitor?.isPluginAvailable('Preferences');

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
        // Data loading is now handled in the async init() method.
    }
    
    private async load() {
        let encryptedData: string | null = null;
        try {
            if (canUseStorage()) {
                const { value } = await window.Capacitor!.Plugins.Preferences!.get({ key: DB_KEY });
                encryptedData = value;
            } else {
                encryptedData = localStorage.getItem(DB_KEY);
            }

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
        } catch (e) {
            console.error("Failed to load data from storage:", e);
        }
    }

    private async save() {
        try {
            const encryptedData = encrypt(this.db);
            if (encryptedData) {
                if (canUseStorage()) {
                    await window.Capacitor!.Plugins.Preferences!.set({ key: DB_KEY, value: encryptedData });
                } else {
                    localStorage.setItem(DB_KEY, encryptedData);
                }
            }
        } catch (e) {
            console.error("Failed to save data to storage:", e);
            alert('Critical Error: Could not save data. Your latest changes might be lost.');
        }
    }

    public async init() {
        await this.load();
        if (this.db.transactions.length === 0 && this.db.recurring_transactions.length === 0) {
            console.log("No transactions found, seeding data.");
            await this.seedRecentTransactions();
        }
    }
    
    private async seedRecentTransactions() {
        const today = new Date();
        
        const demoTxs: Omit<Transaction, 'id' | 'ts'>[] = [
            { amount: 350, currency: 'INR', category: 'Food', merchant: 'Swiggy', mood: 4, note: 'Dinner', tags_json: '[]' },
            { amount: 80, currency: 'INR', category: 'Transport', merchant: 'Metro', mood: 3, note: 'Commute', tags_json: '[]' },
            { amount: 1200, currency: 'INR', category: 'Shopping', merchant: 'Myntra', mood: 2, note: 'New Shirt', tags_json: '["impulse"]' },
            { amount: 250, currency: 'INR', category: 'Food', merchant: 'Starbucks', mood: 5, note: 'Coffee meeting', tags_json: '["social"]' },
            { amount: 1500, currency: 'INR', category: 'Groceries', merchant: 'BigBasket', mood: 3, note: 'Weekly stock-up', tags_json: '["planned"]' },
            { amount: 3000, currency: 'INR', category: 'Bills', merchant: 'Airtel', mood: 2, note: 'Internet bill', tags_json: '["planned"]' },
            { amount: 750, currency: 'INR', category: 'Entertainment', merchant: 'PVR Cinemas', mood: 5, note: 'Movie night', tags_json: '["social"]' },
            { amount: 450, currency: 'INR', category: 'Health', merchant: 'Apollo Pharmacy', mood: 3, note: 'Medicines', tags_json: '[]' },
        ];

        this.db.transactions = [];
        
        demoTxs.forEach((tx, i) => {
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
        
        this.db.transactions.sort((a,b) => b.ts - a.ts);
        await this.save();
    }

    public async processRecurringTransactions(): Promise<boolean> {
        let changed = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const rTx of this.db.recurring_transactions) {
            let nextDueDate = new Date(rTx.last_added_date || rTx.start_date);
            
            while (nextDueDate.getTime() <= today.getTime()) {
                if (nextDueDate.getTime() >= new Date(rTx.start_date).getTime()) {
                     const newTx: Omit<Transaction, 'id' | 'ts'> = {
                        amount: rTx.amount, currency: rTx.currency, category: rTx.category, merchant: rTx.merchant,
                        mood: rTx.mood, note: rTx.note, tags_json: rTx.tags_json,
                    };
                    const createdTx = { ...newTx, id: `tx-recurring-${rTx.id}-${nextDueDate.getTime()}`, ts: nextDueDate.getTime() };

                    if (!this.db.transactions.some(t => t.id === createdTx.id)) {
                        this.db.transactions.push(createdTx);
                        rTx.last_added_date = nextDueDate.getTime();
                        changed = true;
                    }
                }

                if (rTx.frequency === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
                else if (rTx.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
                else if (rTx.frequency === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                else break;
            }
        }
        
        if (changed) await this.save();
        return changed;
    }

    // Transactions
    public getTransactions(): Transaction[] { return [...this.db.transactions].sort((a,b) => b.ts - a.ts); }
    
    public async addTransaction(tx: Omit<Transaction, 'id' | 'ts'>): Promise<Transaction> {
        const newTx: Transaction = { ...tx, id: `tx-${Date.now()}`, ts: Date.now() };
        this.db.transactions.push(newTx);
        this.updateStreakData(new Date(newTx.ts));
        await this.save();
        return newTx;
    }
    
    public async updateTransaction(tx: Transaction): Promise<void> {
        const index = this.db.transactions.findIndex(t => t.id === tx.id);
        if (index > -1) {
            this.db.transactions[index] = tx;
            await this.save();
        }
    }
    
    public async deleteTransaction(id: string): Promise<void> {
        this.db.transactions = this.db.transactions.filter(t => t.id !== id);
        await this.save();
    }

    public async deleteTransactions(ids: string[]): Promise<void> {
        this.db.transactions = this.db.transactions.filter(t => !ids.includes(t.id));
        await this.save();
    }

    // Recurring Transactions
    public getRecurringTransactions(): RecurringTransaction[] { return [...this.db.recurring_transactions].sort((a,b) => a.start_date - b.start_date); }

    public async addRecurringTransaction(rTx: Omit<RecurringTransaction, 'id' | 'last_added_date'>): Promise<RecurringTransaction> {
        const newRTx: RecurringTransaction = { ...rTx, id: `rtx-${Date.now()}`, last_added_date: null };
        this.db.recurring_transactions.push(newRTx);
        await this.save();
        return newRTx;
    }

    public async updateRecurringTransaction(rTx: RecurringTransaction): Promise<void> {
        const index = this.db.recurring_transactions.findIndex(t => t.id === rTx.id);
        if (index > -1) {
            this.db.recurring_transactions[index] = rTx;
            await this.save();
        }
    }

    public async deleteRecurringTransaction(id: string): Promise<void> {
        this.db.recurring_transactions = this.db.recurring_transactions.filter(t => t.id !== id);
        await this.save();
    }

    // Budgets
    public getBudgets(): Budget[] { return [...this.db.budgets]; }
    
    public async addBudget(budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> {
        const newBudget: Budget = { ...budget, id: `budget-${Date.now()}`, created_at: Date.now() };
        this.db.budgets.push(newBudget);
        await this.save();
        return newBudget;
    }
    
    public async updateBudget(budget: Budget): Promise<void> {
        const index = this.db.budgets.findIndex(b => b.id === budget.id);
        if (index > -1) {
            this.db.budgets[index] = budget;
            await this.save();
        }
    }
    
    public async deleteBudget(id: string): Promise<void> {
        this.db.budgets = this.db.budgets.filter(b => b.id !== id);
        await this.save();
    }

    // Custom Categories
    public getCustomCategories(): string[] { return [...this.db.customCategories]; }
    
    public async addCustomCategory(category: string): Promise<void> {
        if (!this.db.customCategories.includes(category)) {
            this.db.customCategories.push(category);
            await this.save();
        }
    }

    public async deleteCustomCategory(category: string): Promise<void> {
        this.db.customCategories = this.db.customCategories.filter(c => c !== category);
        await this.save();
    }
    
    // Challenges
    public getUserChallenges(): UserChallenge[] { return [...this.db.userChallenges]; }

    public async saveUserChallenges(challenges: UserChallenge[]): Promise<void> {
        this.db.userChallenges = challenges;
        await this.save();
    }
    
    // Streak
    public getStreakData(): { currentStreak: number, lastLogDate: string } { return { ...this.db.streakData }; }

    private updateStreakData(logDate: Date) {
        const todayStr = logDate.toISOString().split('T')[0];
        if (this.db.streakData.lastLogDate === todayStr) return;
        const yesterday = new Date(logDate);
        yesterday.setDate(logDate.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (this.db.streakData.lastLogDate === yesterdayStr) this.db.streakData.currentStreak += 1;
        else this.db.streakData.currentStreak = 1;
        this.db.streakData.lastLogDate = todayStr;
    }

    // Theme (uses localStorage for synchronous access to prevent flashing)
    public getTheme(): Theme {
        const theme = localStorage.getItem(THEME_KEY) as Theme | null;
        if (theme) return theme;
        if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    }

    public setTheme(theme: Theme) { localStorage.setItem(THEME_KEY, theme); }
    
    // Data Management
    public exportToCsv(): string {
        const headers = ['id', 'ts', 'amount', 'currency', 'category', 'merchant', 'mood', 'note', 'tags_json'];
        const rows = this.db.transactions.map(tx => headers.map(header => JSON.stringify(tx[header as keyof Transaction])).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    
    public async deleteAllData(): Promise<void> {
        this.db = {
            transactions: [], budgets: [], recurring_transactions: [], customCategories: [], userChallenges: [],
            streakData: { currentStreak: 0, lastLogDate: '' },
        };
        if (canUseStorage()) {
            await window.Capacitor!.Plugins.Preferences!.remove({ key: DB_KEY });
        } else {
            localStorage.removeItem(DB_KEY);
        }
        localStorage.removeItem(THEME_KEY);
        window.location.reload();
    }
}

export const dbService = new DbService();
