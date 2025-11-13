import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import type { Transaction, MintorAiMessage, MintorAction, CoachingTip, Screen, KnowledgeBase } from '../types';
import { dbService } from './db';
import { ChartBarIcon, LightbulbIcon } from '../constants';

let kbData: KnowledgeBase | null = null;
const getKbData = async (): Promise<KnowledgeBase> => {
    if (kbData) return kbData;
    try {
        const response = await fetch('/assets/kb/mintor_kb.json');
        if (!response.ok) throw new Error('Failed to fetch knowledge base');
        kbData = await response.json();
        return kbData as KnowledgeBase;
    } catch (e) {
        console.error("Could not load Mintor AI knowledge base.", e);
        return {
          greetingsAndChitChat: {},
          financeGeneral: {},
          howToApp: {},
          appAbout: {},
          savingTips: { general: [] },
        };
    }
};

const isOnline = async (): Promise<boolean> => {
    if (window.Capacitor?.isPluginAvailable('Network')) {
        try {
            const status = await window.Capacitor.Plugins.Network!.getStatus();
            return status.connected;
        } catch (e) {
            console.warn("Capacitor Network plugin check failed, falling back to navigator.onLine", e);
        }
    }
    return navigator.onLine;
};


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

// --- All helper and analysis functions are consolidated here ---

type AppData = {
    transactions: Transaction[];
};

const analyzeTopCategory = (data: AppData): CoachingTip | null => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) );
    startOfWeek.setHours(0,0,0,0);
    const thisWeekTxs = data.transactions.filter(tx => tx.ts >= startOfWeek.getTime());
    if (thisWeekTxs.length < 3) return null;

    const categoryTotals = thisWeekTxs.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (!topCategory) return null;

    return { id: 'top-category', icon: ChartBarIcon, title: 'Top Category This Week', text: `Your biggest spending category so far is **${topCategory[0]}**, amounting to **${formatCurrency(topCategory[1])}**.` };
};

const getCoachingTip = async (): Promise<CoachingTip | null> => {
    const data: AppData = { transactions: dbService.getTransactions() };
    const tipFunctions = [analyzeTopCategory];
    for (const fn of tipFunctions.sort(() => Math.random() - 0.5)) {
        const result = fn(data);
        if (result) return result;
    }
    const kb = await getKbData();
    const tips = kb?.savingTips?.general || [];
    if (tips.length === 0) return { id: 'default-tip', icon: LightbulbIcon, title: 'Daily Tip', text: "Review your subscriptions regularly. You might find services you no longer need!" };
    const getDayOfYear = () => { const now = new Date(); const start = new Date(now.getFullYear(), 0, 0); const diff = now.getTime() - start.getTime(); return Math.floor(diff / (1000 * 60 * 60 * 24)); };
    const dayIndex = getDayOfYear();
    return { id: `daily-tip-${dayIndex}`, icon: LightbulbIcon, title: 'Daily Tip', text: tips[dayIndex % tips.length] };
};

const generateWeeklyDigest = (transactions: Transaction[]): string | null => {
    const today = new Date(); const dayOfWeek = today.getDay();
    const endOfLastWeek = new Date(today); endOfLastWeek.setDate(today.getDate() - dayOfWeek); endOfLastWeek.setHours(23, 59, 59, 999);
    const startOfLastWeek = new Date(endOfLastWeek); startOfLastWeek.setDate(endOfLastWeek.getDate() - 6); startOfLastWeek.setHours(0, 0, 0, 0);
    const lastWeekTxs = transactions.filter(tx => tx.ts >= startOfLastWeek.getTime() && tx.ts <= endOfLastWeek.getTime());
    if (lastWeekTxs.length < 3) return "You didn't have much activity last week. Let's see what this week holds!";
    const totalSpent = lastWeekTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryTotals = lastWeekTxs.reduce((acc, tx) => { acc[tx.category] = (acc[tx.category] || 0) + tx.amount; return acc; }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const dailyTotals = lastWeekTxs.reduce((acc, tx) => { const day = new Date(tx.ts).getDay(); acc[day] = (acc[day] || 0) + tx.amount; return acc; }, {} as Record<number, number>);
    const busiestDay = Object.entries(dailyTotals).sort((a,b) => b[1] - a[1])[0];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let summary = `Last week, you spent a total of **${formatCurrency(totalSpent)}** across **${lastWeekTxs.length}** transactions.`;
    if (topCategory) summary += `\nYour top category was **${topCategory[0]}** (${formatCurrency(topCategory[1])}).`;
    if (busiestDay) summary += `\nYour busiest day was **${dayNames[parseInt(busiestDay[0])]}**, with **${formatCurrency(busiestDay[1])}** spent.`;
    summary += "\n\nHave a great week ahead!";
    return summary;
};

const getContextualStartingPrompts = (screen: Screen): MintorAction[] => {
    switch(screen) {
        case 'Home':
            return [
                { label: 'Biggest expense this week?', type: 'query', payload: 'What was my biggest expense this week?' },
                { label: 'How much did I spend on food this month?', type: 'query', payload: 'How much did I spend on food this month?' },
                { label: 'Give me saving tips', type: 'query', payload: 'Give me saving tips' },
                { label: 'What is an emergency fund?', type: 'query', payload: 'What is an emergency fund?' },
            ];
        default:
             return [
                { label: 'Analyze my spending', type: 'query', payload: 'Analyze my spending this month' },
                { label: 'Give me saving tips', type: 'query', payload: 'Give me saving tips' },
                { label: 'What is a credit score?', type: 'query', payload: 'What is a credit score?' },
                { label: 'How do I edit a transaction?', type: 'query', payload: 'How do I edit a transaction?' },
            ];
    }
};

const getKBAnswer = (query: string, kb: KnowledgeBase): string | null => {
    if (!kb) return null;
    const lowerQuery = query.toLowerCase();
    const allSections = { ...kb.greetingsAndChitChat, ...kb.financeGeneral, ...kb.howToApp, ...kb.appAbout };
    
    let bestMatch: { key: string, score: number } | null = null;
    for (const key in allSections) {
        const entry = allSections[key as keyof typeof allSections];
        for (const keyword of entry.keywords || []) {
            // FIX: Use regex with word boundaries to prevent partial matches like 'hi' in 'this'.
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lowerQuery)) {
                const score = keyword.length; // Simple scoring: longer keyword = better match
                if (!bestMatch || score > bestMatch.score) {
                    bestMatch = { key, score };
                }
            }
        }
    }

    if (bestMatch) {
        const entry = allSections[bestMatch.key as keyof typeof allSections];
        const answer = Array.isArray(entry.answers) ? entry.answers[Math.floor(Math.random() * entry.answers.length)] : entry.answer;
        return answer || null;
    }
    return null;
};

const getPeriodData = (period: 'month' | 'week' | 'day', transactions: Transaction[], offset: number = 0) => {
    const now = new Date();
    const startOfPeriod = new Date(now);
    if (period === 'month') startOfPeriod.setMonth(now.getMonth() - offset, 1);
    else if (period === 'week') { const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); startOfPeriod.setDate(diff - (offset * 7)); }
    else startOfPeriod.setDate(now.getDate() - offset);
    startOfPeriod.setHours(0, 0, 0, 0);
    const endOfPeriod = new Date(startOfPeriod);
    if (period === 'month') { endOfPeriod.setMonth(endOfPeriod.getMonth() + 1); endOfPeriod.setDate(0); }
    else if (period === 'week') endOfPeriod.setDate(startOfPeriod.getDate() + 6);
    endOfPeriod.setHours(23, 59, 59, 999);
    return transactions.filter(t => t.ts >= startOfPeriod.getTime() && t.ts <= endOfPeriod.getTime());
};

// --- Local Analysis Functions (Tools for the AI) ---
const analyzeSpending = (period: 'month' | 'week' | 'day', data: AppData): string => {
    const periodTxs = getPeriodData(period, data.transactions);
    if (periodTxs.length === 0) return `You haven't recorded any spending this ${period}.`;
    const total = periodTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryTotals = periodTxs.reduce((acc, tx) => { acc[tx.category] = (acc[tx.category] || 0) + tx.amount; return acc; }, {} as Record<string, number>);
    const [topCategory, topCatAmount] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    return `This ${period}, you spent a total of **${formatCurrency(total)}** across **${periodTxs.length}** transactions. Your biggest spending category was **${topCategory}**, amounting to **${formatCurrency(topCatAmount)}**.`;
};

const getCategorySpend = (category: string, period: 'month' | 'week' | 'day', data: AppData): string => {
    const periodTxs = getPeriodData(period, data.transactions);
    const categoryTxs = periodTxs.filter(tx => tx.category.toLowerCase() === category.toLowerCase());
    if (categoryTxs.length === 0) return `You haven't spent anything on **${category}** this ${period}.`;
    const total = categoryTxs.reduce((sum, tx) => sum + tx.amount, 0);
    return `This ${period}, you've spent **${formatCurrency(total)}** on **${category}**.`;
};

// --- Gemini Function Declarations ---
const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'analyzeSpending',
        description: 'Analyzes user spending for a given period (day, week, month). Provides a summary of total spending, top category, and transaction count.',
        parameters: { type: Type.OBJECT, properties: { period: { type: Type.STRING, enum: ['day', 'week', 'month'], description: 'The time period to analyze.' } }, required: ['period'] }
    },
    {
        name: 'getCategorySpend',
        description: 'Calculates the total amount spent on a specific category within a given period.',
        parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING, description: 'The spending category to analyze.' }, period: { type: Type.STRING, enum: ['day', 'week', 'month'], description: 'The time period.' } }, required: ['category', 'period'] }
    },
];

// --- Main AI Service Logic ---
export const mintorAiService = {
    getCoachingTip,
    getContextualStartingPrompts,
    generateWeeklyDigest,
    getResponse: async (query: string): Promise<Omit<MintorAiMessage, 'id'>> => {
        const kb = await getKbData();
        
        // 1. OFFLINE-FIRST: Check local knowledge base.
        const kbAnswer = getKBAnswer(query, kb);
        if (kbAnswer) return { sender: 'bot', text: kbAnswer };

        // 2. CONNECTIVITY CHECK: If no KB answer, check network.
        if (!(await isOnline())) {
            return { sender: 'bot', text: "It seems you're offline. I can answer general financial questions, but for personal spending analysis, I need an internet connection.", actions: [ { label: 'What is a credit score?', type: 'query', payload: 'What is a credit score?' } ] };
        }
        
        // 3. ONLINE POWER: Use Gemini with function calling.
        try {
            const data: AppData = { transactions: dbService.getTransactions() };
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const systemInstruction = `You are Mintor, the friendly and helpful AI assistant within the Sentimint app. Your goal is to provide concise, helpful financial advice. Use the provided tools to answer questions about the user's spending data. For general conversation or questions outside your tools' scope, answer conversationally. Format currency using the Indian Rupee symbol (₹) and comma separators (e.g., ₹1,23,456). Use markdown for formatting, especially bolding.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: { systemInstruction, tools: [{ functionDeclarations }] },
            });
            
            const functionCalls = response.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                const fc = functionCalls[0];
                const { name, args } = fc;
                let resultText = "Sorry, I couldn't process that.";

                switch (name) {
                    case 'analyzeSpending':
                        resultText = analyzeSpending(args.period as 'month' | 'week' | 'day', data);
                        break;
                    case 'getCategorySpend':
                        resultText = getCategorySpend(args.category as string, args.period as 'month' | 'week' | 'day', data);
                        break;
                }
                return { sender: 'bot', text: resultText };
            }
            
            return { sender: 'bot', text: response.text };

        } catch (error) {
            console.error("Error with Gemini API:", error);
            return { sender: 'bot', text: "I'm having a little trouble connecting right now. Please try again in a moment." };
        }
    }
};
