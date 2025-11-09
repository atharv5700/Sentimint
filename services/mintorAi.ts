import type { Transaction, Goal, MintorAiMessage, MintorAction } from '../types';
import { dbService } from './db';

// The 'assert' syntax is not supported. We will fetch the JSON file instead.
let kbData: any = null;
const getKbData = async () => {
    if (kbData) return kbData;
    try {
        const response = await fetch('../assets/kb/mintu_kb.json');
        if (!response.ok) throw new Error('Failed to fetch knowledge base');
        kbData = await response.json();
        return kbData;
    } catch (e) {
        console.error("Could not load Mintor AI knowledge base.", e);
        // Provide a fallback object to prevent crashes.
        return {
          financeGeneral: {},
          howToApp: {},
          appAbout: {},
          savingTips: { general: [] },
          smallTalk: {}
        };
    }
};


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

interface MintorData {
    transactions: Transaction[];
    goals: Goal[];
}

const getPeriodData = (period: 'month' | 'week' | 'day', transactions: Transaction[]) => {
    const now = new Date();
    const startOfPeriod = new Date(now);
    if (period === 'month') startOfPeriod.setDate(1);
    if (period === 'week') startOfPeriod.setDate(now.getDate() - now.getDay());
    startOfPeriod.setHours(0, 0, 0, 0);

    return transactions.filter(t => t.ts >= startOfPeriod.getTime());
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

    let response = `In this ${period}, you spent a total of **${formatCurrency(total)}** across ${periodTxs.length} transactions.\n\n`;
    response += `Your biggest spending category was **${topCategory}**, amounting to **${formatCurrency(topCatAmount)}**.\n\n`;
    if(negMoodCount > 0){
        response += `You made **${negMoodCount}** purchases while feeling negative, totaling **${formatCurrency(negMoodTotal)}**. It might be helpful to review these.`
    } else {
        response += `Great job! You didn't record any spending with negative emotions this ${period}.`
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

const getSavingTips = (data: MintorData, kb: any): string => {
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

const calculateSIP = (monthly: number, rate: number, years: number): string => {
    const i = rate / 12 / 100;
    const n = years * 12;
    const futureValue = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    return `A monthly SIP of ${formatCurrency(monthly)} at an expected ${rate}% return for ${years} years could grow to approximately **${formatCurrency(futureValue)}**.`;
};

const getKBAnswer = (topic: string, kb: any, keyOverride?: string): string => {
    if (!kb) return "Sorry, my knowledge base is currently unavailable.";
    const lowerTopic = topic.toLowerCase();
    
    const allKBs = { ...kb.financeGeneral, ...kb.howToApp, ...kb.appAbout };
    
    const key = keyOverride || Object.keys(allKBs).find(k => lowerTopic.includes(k));
    
    if (key && allKBs[key as keyof typeof allKBs]) {
        return allKBs[key as keyof typeof allKBs];
    }
    
    if (lowerTopic.includes('what can you do') || lowerTopic.includes('help')) {
        return "I can do a few things, all offline:\n- **Analyse your spending** for a day, week, month or year.\n- Show you your **biggest category**.\n- Give you **saving tips** based on your habits.\n- Explain financial topics like **SIP, PPF, or credit scores**.\n- Calculate **loan EMIs** or **SIP returns**.\n- Help you find features like **how to edit a transaction**.";
    }

    return "I'm not sure about that. Try asking 'help' to see what I can do.";
};

const getSmallTalkResponse = (query: string, kb: any): {text: string, actions: MintorAction[]} | null => {
    if (!kb?.smallTalk) return null;
    const lowerQuery = query.toLowerCase().replace(/[^\w\s]/gi, '');
    const smallTalk = kb.smallTalk;
    for (const key in smallTalk) {
        if (key.split('|').some(keyword => lowerQuery.trim() === keyword)) {
            const responses = smallTalk[key as keyof typeof smallTalk];
            return {
                text: responses[Math.floor(Math.random() * responses.length)],
                actions: [
                    { label: 'Analyse my spending', type: 'query', payload: 'Analyze my spending this month' },
                    { label: 'What can you do?', type: 'query', payload: 'help' }
                ]
            };
        }
    }
    return null;
}

export const mintorAiService = {
    getResponse: async (query: string): Promise<Omit<MintorAiMessage, 'id'>> => {

        const kb = await getKbData();

        const smallTalkResponse = getSmallTalkResponse(query, kb);
        if (smallTalkResponse) {
            return {
                sender: 'bot',
                text: smallTalkResponse.text,
                actions: smallTalkResponse.actions
            };
        }

        const data: MintorData = {
            transactions: dbService.getTransactions(),
            goals: dbService.getGoals(),
        };

        const intents = [
            {
                regex: /emi for.*?([\d,]+).*?(\d+(\.\d+)?)% for (\d+)/i,
                handler: (matches: string[]) => calculateEMI(parseFloat(matches[1].replace(/,/g, '')), parseFloat(matches[2]), parseFloat(matches[4]))
            },
            {
                regex: /sip.*?([\d,]+) for (\d+).*?(\d+(\.\d+)?)%/i,
                handler: (matches: string[]) => calculateSIP(parseFloat(matches[1].replace(/,/g, '')), parseFloat(matches[3]), parseFloat(matches[2]))
            },
            {
                regex: /analyse|analysis|spending last (month|week)|spending this (month|week|day)|spending today/i,
                handler: (matches: string[], data: MintorData) => {
                    const period = (matches[1] || matches[2] || (matches[0].includes('today') ? 'day' : 'month')) as 'month'|'week'|'day';
                    return analyzeSpending(period, data);
                },
                actions: [{ label: 'Open Insights', type: 'navigate', payload: 'Insights' }]
            },
            {
                regex: /biggest category (last|this) (month|week|day)/i,
                handler: (matches: string[], data: MintorData) => getBiggestCategory(matches[2] as 'month'|'week'|'day', data),
                actions: [{ label: 'Show Transactions', type: 'navigate', payload: 'Transactions' }]
            },
            {
                regex: /how can I save|how to save|cut costs|reduce expenses|saving tips/i,
                handler: (_: string[], data: MintorData) => getSavingTips(data, kb),
                actions: [{ label: 'Create a Goal', type: 'navigate', payload: 'Goals' }]
            },
            {
                regex: /what is (sip|ppf|fd|emergency fund|credit score|debt snowball|mutual fund|nps|elss|etf)|what can you do|help/i,
                handler: (matches: string[]) => getKBAnswer(matches[0], kb)
            },
            {
                regex: /tell me about (this app|sentimint)|who made you|about sentimint/i,
                handler: (matches: string[]) => getKBAnswer(matches[0], kb, 'sentimint'),
                actions: [{ label: 'Open About Page', type: 'navigate', payload: 'Settings' }]
            },
            {
                regex: /(edit|delete|link).*? transaction|set a goal|export csv|delete data|change theme/i,
                handler: (matches: string[]) => getKBAnswer(matches[0], kb)
            },
        ];

        for (const intent of intents) {
            const match = query.toLowerCase().match(intent.regex);
            if (match) {
                const handler = intent.handler as Function;
                const text = handler.length === 2 ? handler(match, data) : handler(match);
                return {
                    sender: 'bot',
                    text,
                    actions: intent.actions as MintorAction[] || []
                };
            }
        }
        
        return {
            sender: 'bot',
            text: getKBAnswer(query.toLowerCase(), kb),
        };
    }
};