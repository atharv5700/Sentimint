import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import type { Transaction, MintorAiMessage, MintorAction, CoachingTip, Screen, KnowledgeBase } from '../types';
import { dbService } from './db';
import { ChartBarIcon, LightbulbIcon, TrendingUpIcon } from '../constants';

// This is the single source of truth for the AI knowledge base.
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

const getKBAnswer = (query: string, kb: KnowledgeBase): string | null => {
    if (!kb) return null;
    const lowerQuery = query.toLowerCase();
    
    const allSections = { ...kb.greetingsAndChitChat, ...kb.financeGeneral, ...kb.howToApp, ...kb.appAbout };
    
    for (const key in allSections) {
        const entry = allSections[key as keyof typeof allSections];
        const keywords = entry.keywords || [];
        const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');
        
        if (regex.test(lowerQuery)) {
            const answer = Array.isArray(entry.answers) 
                ? entry.answers[Math.floor(Math.random() * entry.answers.length)] 
                : entry.answer;
            if (answer) return answer;
        }
    }
    return null;
};

const getContextualStartingPrompts = (screen: Screen): MintorAction[] => {
    switch(screen) {
        case 'Home':
            return [
                { label: 'Biggest expense this week?', type: 'query', payload: 'What was my biggest expense this week?' },
                { label: 'Food spending this month?', type: 'query', payload: 'How much did I spend on food this month?' },
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

// --- Main AI Service Logic ---

export const mintorAiService = {
    getCoachingTip,
    getContextualStartingPrompts,
    generateWeeklyDigest,
    getResponse: async (query: string): Promise<Omit<MintorAiMessage, 'id'>> => {
        const kb = await getKbData();
        
        // 1. OFFLINE-FIRST: Always check local knowledge base first for instant answers.
        const kbAnswer = getKBAnswer(query, kb);
        if (kbAnswer) {
            return { sender: 'bot', text: kbAnswer, actions: [] };
        }

        // 2. SMART CONNECTIVITY: If no KB answer, check for a reliable internet connection.
        if (!(await isOnline())) {
            return {
                sender: 'bot',
                text: "It looks like you're offline. I can only answer general questions right now. For a full analysis of your spending, please connect to the internet.",
                actions: [
                    { label: 'What is a credit score?', type: 'query', payload: 'What is a credit score?' },
                    { label: 'How do I add a budget?', type: 'query', payload: 'How do I add a budget?' },
                ]
            };
        }
        
        // 3. ONLINE POWER: If online and no KB answer, use the Gemini API.
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const systemInstruction = `You are Mintor, the friendly and helpful AI assistant within the Sentimint app. The app you live in is called Sentimint. Your goal is to provide concise, helpful, and encouraging financial advice. When asked about your identity, explain that you use Google's advanced AI to provide answers but the user's financial data remains private on their device. Use markdown for formatting, especially bolding for emphasis on key terms and numbers.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: {
                    systemInstruction,
                },
            });

            return { sender: 'bot', text: response.text, actions: [] };

        } catch (error) {
            console.error("Error getting response from Gemini API:", error);
            // Graceful error handling if the API fails.
            return {
                sender: 'bot',
                text: "I'm having a little trouble connecting to my advanced features right now. Please try again in a moment. In the meantime, I can still answer general questions from my local knowledge.",
                actions: [
                    { label: 'What is a SIP?', type: 'query', payload: 'What is SIP?' },
                    { label: 'Tell me about the 50/30/20 rule', type: 'query', payload: 'What is the 50/30/20 budgeting rule?' },
                ]
            };
        }
    }
};
