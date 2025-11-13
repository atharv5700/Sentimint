import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import type { Transaction, MintorAiMessage, MintorAction, CoachingTip, AppContextType, Screen, KnowledgeBase } from '../types';
import { dbService } from './db';
import { ChartBarIcon, LightbulbIcon, TrendingUpIcon, TrophyIcon } from '../constants';

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

// --- Coaching Tip Generators ---

type AppData = Pick<AppContextType, 'transactions'>;

const analyzeTopCategory = (data: AppData): CoachingTip | null => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) ); // Monday as start of week
    startOfWeek.setHours(0,0,0,0);
    const thisWeekTxs = data.transactions.filter(tx => tx.ts >= startOfWeek.getTime());
    if (thisWeekTxs.length < 3) return null;

    const categoryTotals = thisWeekTxs.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (!topCategory) return null;

    return {
        id: 'top-category',
        icon: ChartBarIcon,
        title: 'Top Category This Week',
        text: `Your biggest spending category so far is **${topCategory[0]}**, amounting to **${formatCurrency(topCategory[1])}**.`,
    };
};

const analyzeFrequentSpending = (data: AppData): CoachingTip | null => {
    const last7DaysTxs = data.transactions.filter(tx => tx.ts >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (last7DaysTxs.length < 5) return null;

    const merchantCounts = last7DaysTxs.reduce((acc, tx) => {
        if (tx.merchant) {
            acc[tx.merchant] = (acc[tx.merchant] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const frequentMerchant = Object.entries(merchantCounts).find(([, count]) => count >= 4);
    if (!frequentMerchant) return null;
    
    const [merchant, count] = frequentMerchant;
    const total = last7DaysTxs.filter(tx => tx.merchant === merchant).reduce((sum, tx) => sum + tx.amount, 0);

    return {
        id: 'frequent-spending',
        icon: TrendingUpIcon,
        title: 'Frequent Purchases',
        text: `You've made **${count}** purchases at **${merchant}** this week, totaling **${formatCurrency(total)}**. Small expenses can add up quickly!`,
    };
};

const analyzeWeekdaySpending = (data: AppData): CoachingTip | null => {
    const last30DaysTxs = data.transactions.filter(tx => tx.ts >= Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (last30DaysTxs.length < 10) return null;

    const transportTxs = last30DaysTxs.filter(tx => tx.category === 'Transport');
    if (transportTxs.length < 5) return null;

    const weekdaySpending = transportTxs.filter(tx => {
        const day = new Date(tx.ts).getDay();
        return day > 0 && day < 6; // Monday to Friday
    }).reduce((sum, tx) => sum + tx.amount, 0);

    const totalTransport = transportTxs.reduce((sum, tx) => sum + tx.amount, 0);

    if (weekdaySpending / totalTransport < 0.7) return null; // Only if >70% is on weekdays

    return {
        id: 'weekday-spending',
        icon: LightbulbIcon,
        title: 'Commuting Costs',
        text: `You spend a lot on **Transport** during weekdays. Have you considered a monthly pass to potentially save money?`
    };
};

const getCoachingTip = async (): Promise<CoachingTip | null> => {
    const data: AppData = {
        transactions: dbService.getTransactions(),
    };
    
    const tipFunctions = [
        analyzeTopCategory,
        analyzeFrequentSpending,
        analyzeWeekdaySpending,
    ];
    
    // Shuffle and find the first valid tip
    for (const fn of tipFunctions.sort(() => Math.random() - 0.5)) {
        const result = fn(data);
        if (result) return result;
    }
    
    // Fallback tip - now daily rotating from KB
    const kb = await getKbData();
    const tips = kb?.savingTips?.general || [];
    if (tips.length === 0) {
        return {
            id: 'default-tip',
            icon: LightbulbIcon,
            title: 'Daily Tip',
            text: "Review your subscriptions regularly. You might find services you no longer need!",
        };
    }

    const getDayOfYear = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    const dayIndex = getDayOfYear();
    const fallbackTipText = tips[dayIndex % tips.length];

    return {
        id: `daily-tip-${dayIndex}`,
        icon: LightbulbIcon,
        title: 'Daily Tip',
        text: fallbackTipText,
    };
};

const generateWeeklyDigest = (transactions: Transaction[]): string | null => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1
    
    const endOfLastWeek = new Date(today);
    endOfLastWeek.setDate(today.getDate() - dayOfWeek);
    endOfLastWeek.setHours(23, 59, 59, 999);

    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const lastWeekTxs = transactions.filter(tx => tx.ts >= startOfLastWeek.getTime() && tx.ts <= endOfLastWeek.getTime());
    
    if (lastWeekTxs.length < 3) {
        return "You didn't have much activity last week. Let's see what this week holds!";
    }

    const totalSpent = lastWeekTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryTotals = lastWeekTxs.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    const dailyTotals = lastWeekTxs.reduce((acc, tx) => {
        const day = new Date(tx.ts).getDay();
        acc[day] = (acc[day] || 0) + tx.amount;
        return acc;
    }, {} as Record<number, number>);

    const busiestDay = Object.entries(dailyTotals).sort((a,b) => b[1] - a[1])[0];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    let summary = `Last week, you spent a total of **${formatCurrency(totalSpent)}** across **${lastWeekTxs.length}** transactions.`;
    if (topCategory) {
        summary += `\nYour top category was **${topCategory[0]}** (${formatCurrency(topCategory[1])}).`;
    }
    if (busiestDay) {
        summary += `\nYour busiest day was **${dayNames[parseInt(busiestDay[0])]}**, with **${formatCurrency(busiestDay[1])}** spent.`;
    }
    summary += "\n\nHave a great week ahead!";
    return summary;
};


// --- Mintor AI Chat Logic ---

interface MintorData {
    transactions: Transaction[];
}

const getPeriodData = (period: 'month' | 'week' | 'day', transactions: Transaction[], offset: number = 0) => {
    const now = new Date();
    const startOfPeriod = new Date(now);
    
    if (period === 'month') {
        startOfPeriod.setMonth(now.getMonth() - offset, 1);
    } else if (period === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        startOfPeriod.setDate(diff - (offset * 7));
    } else { // day
        startOfPeriod.setDate(now.getDate() - offset);
    }
    startOfPeriod.setHours(0, 0, 0, 0);

    const endOfPeriod = new Date(startOfPeriod);
     if (period === 'month') {
        endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
        endOfPeriod.setDate(0); // Last day of previous month
    } else if (period === 'week') {
        endOfPeriod.setDate(startOfPeriod.getDate() + 6);
    }
    // For 'day', start and end are the same day.
    endOfPeriod.setHours(23, 59, 59, 999);

    return transactions.filter(t => t.ts >= startOfPeriod.getTime() && t.ts <= endOfPeriod.getTime());
};


const analyzeSpending = (period: 'month' | 'week' | 'day', data: MintorData): string => {
    const periodTxs = getPeriodData(period, data.transactions);
    if (periodTxs.length === 0) return `You haven't recorded any spending this ${period}.`;

    const total = periodTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryTotals = periodTxs.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const [topCategory, topCatAmount] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    
    const negMoodTxs = periodTxs.filter(tx => tx.mood <= 2);
    const negMoodTotal = negMoodTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const negMoodCount = negMoodTxs.length;

    let response = `This ${period}, you spent a total of **${formatCurrency(total)}** across ${periodTxs.length} transactions.\n\n`;
    response += `Your biggest spending category was **${topCategory}**, amounting to **${formatCurrency(topCatAmount)}**.\n\n`;
    if(negMoodCount > 0){
        response += `You made **${negMoodCount}** purchases while feeling negative, totaling **${formatCurrency(negMoodTotal)}**. It might be helpful to review these.`
    } else {
        response += `Great job! You didn't record any spending with negative emotions this ${period}.`
    }
    return response;
};

const compareSpending = (category: string, period: 'month' | 'week', data: MintorData): string => {
    const currentPeriodTxs = getPeriodData(period, data.transactions, 0);
    const previousPeriodTxs = getPeriodData(period, data.transactions, 1);
    
    const filterByCategory = (txs: Transaction[]) => category.toLowerCase() === 'all' ? txs : txs.filter(tx => tx.category.toLowerCase() === category.toLowerCase());

    const currentTotal = filterByCategory(currentPeriodTxs).reduce((sum, tx) => sum + tx.amount, 0);
    const previousTotal = filterByCategory(previousPeriodTxs).reduce((sum, tx) => sum + tx.amount, 0);

    const categoryText = category.toLowerCase() === 'all' ? 'total spending' : `spending on **${category}**`;

    if (currentTotal === 0 && previousTotal === 0) {
        return `There's no spending data for ${categoryText} in the current or previous ${period}.`;
    }

    let response = `Comparing your ${categoryText}:\n`;
    response += `- **This ${period}:** ${formatCurrency(currentTotal)}\n`;
    response += `- **Last ${period}:** ${formatCurrency(previousTotal)}\n\n`;

    if (previousTotal > 0) {
        const diff = currentTotal - previousTotal;
        const percentageChange = (diff / previousTotal) * 100;
        if (diff > 0) {
            response += `That's an increase of **${formatCurrency(diff)}** (**${percentageChange.toFixed(0)}%**).`;
        } else {
            response += `That's a decrease of **${formatCurrency(Math.abs(diff))}** (**${Math.abs(percentageChange).toFixed(0)}%**). Great job!`;
        }
    } else {
        response += `You didn't spend in this category last ${period}.`;
    }
    return response;
};


const getBiggestCategory = (period: 'month' | 'week' | 'day', data: MintorData): string => {
    const periodTxs = getPeriodData(period, data.transactions);
     if (periodTxs.length === 0) return `No spending data for this ${period}.`;

    const categoryTotals = periodTxs.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (!topCategory) return `No categories found for this ${period}.`;

    return `Your biggest category this ${period} was **${topCategory[0]}**, with a total of **${formatCurrency(topCategory[1])}**.`;
};

const getSavingTips = (data: MintorData, kb: KnowledgeBase): string => {
    if (!kb?.savingTips?.general) return "Sorry, I can't access my saving tips right now.";
    const tips = [...kb.savingTips.general];
    // Personalize one tip
    const categoryTotals = data.transactions.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if(topCategory) {
       tips.push(`Your top spending category is **${topCategory[0]}**. Look for ways to reduce costs there. Could you find cheaper alternatives or cut back slightly?`);
    }
    // return 3 random tips
    return "Here are a few tips for you:\n" + tips.sort(() => 0.5 - Math.random()).slice(0, 3).map((tip: string) => `- ${tip}`).join('\n');
};

const calculateEMI = (principal: number, rate: number, years: number): string => {
    const r = rate / 12 / 100;
    const n = years * 12;
    if (r === 0) return `Monthly EMI: **${formatCurrency(principal / n)}**`;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return `For a loan of ${formatCurrency(principal)} at ${rate}% for ${years} years, your monthly EMI would be approximately **${formatCurrency(emi)}**.`;
};

const calculateSIP = (monthlyInvestment: number, rate: number, years: number): string => {
    const i = rate / 12 / 100;
    const n = years * 12;
    const futureValue = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    return `A monthly SIP of ${formatCurrency(monthlyInvestment)} at an expected ${rate}% return for ${years} years could grow to approximately **${formatCurrency(futureValue)}**.`;
};

const getKBAnswer = (topic: string, kb: KnowledgeBase): string | null => {
    if (!kb) return null;
    const lowerTopic = topic.toLowerCase();
    
    const allKBs = { ...kb.greetingsAndChitChat, ...kb.financeGeneral, ...kb.howToApp, ...kb.appAbout };
    
    for (const key in allKBs) {
        const entry = allKBs[key as keyof typeof allKBs];
        // Use regex for more accurate, whole-word matching.
        if (entry && entry.keywords && new RegExp(`\\b(${entry.keywords.join('|')})\\b`, 'i').test(lowerTopic)) {
            const answer = Array.isArray(entry.answers)
                ? entry.answers[Math.floor(Math.random() * entry.answers.length)]
                : entry.answer;
            if (answer) return answer;
        }
    }
    
    return null;
};


const getContextualStartingPrompts = (screen: Screen): MintorAction[] => {
    const defaults: MintorAction[] = [
        { label: 'Analyze my spending', type: 'query', payload: 'Analyze my spending this month' },
        { label: 'Give me saving tips', type: 'query', payload: 'Give me saving tips' },
    ];
    switch(screen) {
        case 'Home':
            return [
                { label: 'Biggest expense this week?', type: 'query', payload: 'What was my biggest expense this week?' },
                { label: 'Food spending this month?', type: 'query', payload: 'How much did I spend on food this month?' },
                { label: 'Give me saving tips', type: 'query', payload: 'Give me saving tips' },
                { label: 'What is an emergency fund?', type: 'query', payload: 'What is an emergency fund?' },
            ];
        case 'Ledger':
             return [
                { label: 'Compare spending: this month vs last', type: 'query', payload: 'Compare my total spending this month vs last month' },
                { label: 'How do I edit a transaction?', type: 'query', payload: 'How do I edit a transaction?' },
                { label: 'Export my data', type: 'query', payload: 'How do I export my data?' },
            ];
        case 'Insights':
            return [
                 { label: 'Compare food spending', type: 'query', payload: 'Compare food spending this month vs last month' },
                 { label: 'Busiest spending day?', type: 'query', payload: 'Which day of the week do I spend most?' },
                 { label: 'What is a credit score?', type: 'query', payload: 'What is a credit score?' },
                 ...defaults,
            ];
        case 'Budgets':
            return [
                { label: 'How can I save faster?', type: 'query', payload: 'How can I save money faster?' },
                { label: 'What is a good savings rate?', type: 'query', payload: 'What is a good savings rate?' },
                { label: 'What is an SIP?', type: 'query', payload: 'What is SIP?' },
                { label: 'How can I improve my budget?', type: 'query', payload: 'How can I improve my budget?' },
            ];
        default:
             return [
                ...defaults,
                { label: 'What is an emergency fund?', type: 'query', payload: 'What is an emergency fund?' },
                { label: 'How do I edit a transaction?', type: 'query', payload: 'How do I edit a transaction?' },
            ];
    }
}

const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'analyzeSpending',
        description: 'Analyzes user spending for a given period (day, week, month). Provides a summary of total spending, top category, and spending associated with negative moods.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                period: { type: Type.STRING, enum: ['day', 'week', 'month'], description: 'The time period to analyze.' }
            },
            required: ['period']
        }
    },
    {
        name: 'compareSpending',
        description: 'Compares spending for a specific category or total spending between the current period and the previous one (e.g., this month vs. last month).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING, description: 'The spending category to compare. Use "all" for total spending.' },
                period: { type: Type.STRING, enum: ['week', 'month'], description: 'The time period for comparison.' }
            },
            required: ['category', 'period']
        }
    },
    {
        name: 'getBiggestCategory',
        description: 'Finds and returns the category with the highest spending for a given period.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                period: { type: Type.STRING, enum: ['day', 'week', 'month'], description: 'The time period to analyze.' }
            },
            required: ['period']
        }
    },
    {
        name: 'getSavingTips',
        description: 'Provides the user with a few personalized or general saving tips.',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'calculateEMI',
        description: 'Calculates the Equated Monthly Installment (EMI) for a loan.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                principal: { type: Type.NUMBER, description: 'The total loan amount.' },
                rate: { type: Type.NUMBER, description: 'The annual interest rate in percent.' },
                years: { type: Type.NUMBER, description: 'The loan tenure in years.' }
            },
            required: ['principal', 'rate', 'years']
        }
    },
    {
        name: 'calculateSIP',
        description: 'Calculates the future value of a Systematic Investment Plan (SIP).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                monthlyInvestment: { type: Type.NUMBER, description: 'The amount invested per month.' },
                rate: { type: Type.NUMBER, description: 'The expected annual rate of return in percent.' },
                years: { type: Type.NUMBER, description: 'The investment duration in years.' }
            },
            required: ['monthlyInvestment', 'rate', 'years']
        }
    },
    {
        name: 'getKBAnswer',
        description: 'Retrieves information about financial topics (like SIP, PPF, credit score) or how to use the Sentimint app (like editing a transaction, setting a budget). Use this for "what is" or "how to" questions.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING, description: 'The financial or app-related topic. E.g., "SIP", "edit transaction", "emergency fund", "help".' }
            },
            required: ['topic']
        }
    },
];

export const mintorAiService = {
    getCoachingTip,
    getContextualStartingPrompts,
    generateWeeklyDigest,
    getResponse: async (query: string): Promise<Omit<MintorAiMessage, 'id'>> => {
        const kb = await getKbData();

        // Step 1: Check KB first for fast, offline-capable answers to common questions.
        const kbAnswer = getKBAnswer(query, kb);
        if (kbAnswer) {
            return { sender: 'bot', text: kbAnswer, actions: [] };
        }

        // Step 2: If no KB match, check for online status before attempting an API call.
        if (!navigator.onLine) {
            return {
                sender: 'bot',
                text: "It looks like you're offline. I can answer saved questions about finance and the app. For a full analysis of your spending, please connect to the internet.",
                actions: []
            };
        }
        
        // Step 3: If online and no direct KB match, use Gemini for advanced NLU and analysis.
        try {
            const data: MintorData = {
                transactions: dbService.getTransactions(),
            };
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const systemInstruction = `You are Mintor, the friendly and helpful AI assistant within the Sentimint app. Your name is Mintor. Always introduce yourself as Mintor and refer to yourself as Mintor. The app you live in is called Sentimint.
- Your goal is to provide concise, helpful, and encouraging financial advice.
- When asked about your identity, explain that you use Google's advanced AI to provide answers but the user's financial data remains private on their device.
- Use the provided tools to answer questions about the user's spending data or financial topics.
- For general conversation or questions outside your tools' scope, answer conversationally.
- Format currency using the Indian Rupee symbol (₹) and comma separators (e.g., ₹1,23,456).
- Use markdown for formatting, especially bolding for emphasis on key terms and numbers.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: {
                    systemInstruction,
                    tools: [{ functionDeclarations }],
                },
            });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const fc = functionCalls[0];
                const { name, args } = fc;
                let resultText = "Sorry, something went wrong.";

                switch (name) {
                    case 'analyzeSpending':
                        resultText = analyzeSpending(args.period as 'month' | 'week' | 'day', data);
                        break;
                    case 'compareSpending':
                        resultText = compareSpending(args.category as string, args.period as 'month' | 'week', data);
                        break;
                    case 'getBiggestCategory':
                        resultText = getBiggestCategory(args.period as 'month' | 'week' | 'day', data);
                        break;
                    case 'getSavingTips':
                        resultText = getSavingTips(data, kb);
                        break;
                    case 'calculateEMI':
                        resultText = calculateEMI(args.principal as number, args.rate as number, args.years as number);
                        break;
                    case 'calculateSIP':
                        resultText = calculateSIP(args.monthlyInvestment as number, args.rate as number, args.years as number);
                        break;
                    case 'getKBAnswer':
                        // This case is now handled before the API call, but we keep it as a fallback.
                        resultText = getKBAnswer(args.topic as string, kb) || "I couldn't find information on that topic.";
                        break;
                    default:
                        resultText = "I'm not sure how to handle that action.";
                }
                
                return { sender: 'bot', text: resultText, actions: [] };
            }
            
            return { sender: 'bot', text: response.text, actions: [] };

        } catch (error) {
            console.error("Error getting response from AI service:", error);
            return {
                sender: 'bot',
                text: "I'm having a little trouble connecting to my advanced features right now. Please try again in a moment.",
                actions: []
            };
        }
    }
};