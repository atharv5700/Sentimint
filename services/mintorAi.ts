import type { Transaction, Goal, MintorAiMessage, MintorAction, SmartInsight, AppContextType, Screen } from '../types';
import { dbService } from './db';
import { ChartBarIcon, LightbulbIcon, TrendingUpIcon, TrophyIcon } from '../constants';

let kbData: any = null;
const getKbData = async () => {
    if (kbData) return kbData;
    try {
        const response = await fetch('/assets/kb/mintu_kb.json');
        if (!response.ok) throw new Error('Failed to fetch knowledge base');
        kbData = await response.json();
        return kbData;
    } catch (e) {
        console.error("Could not load Mintor AI knowledge base.", e);
        return {
          financeGeneral: {},
          howToApp: {},
          appAbout: {},
          savingTips: { general: [] },
          smallTalk: {}
        };
    }
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

// --- Smart Insight Generators ---

type AppData = Pick<AppContextType, 'transactions' | 'goals'>;

const analyzeTopCategory = (data: AppData): SmartInsight | null => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
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
        action: { label: 'See Insights', type: 'navigate', payload: 'Insights' }
    };
};

const analyzeGoalProgress = (data: AppData): SmartInsight | null => {
    const activeGoals = data.goals.filter(g => !g.completed_bool);
    if (activeGoals.length === 0) return null;

    const goal = activeGoals.sort((a, b) => (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount))[0];
    const progress = (goal.current_amount / goal.target_amount) * 100;

    if (progress < 25) return null; // Only show for goals with some progress

    return {
        id: 'goal-progress',
        icon: TrophyIcon,
        title: 'Goal Progress',
        text: `You're **${Math.floor(progress)}%** of the way to your "**${goal.title}**" goal. Keep up the great work!`,
        action: { label: 'View Goals', type: 'navigate', payload: 'Goals' }
    };
};

const analyzeSpendingSpike = (data: AppData): SmartInsight | null => {
    const last14DaysTxs = data.transactions.filter(tx => tx.ts >= Date.now() - 14 * 24 * 60 * 60 * 1000);
    if (last14DaysTxs.length < 10) return null;

    const avgDailySpend = last14DaysTxs.reduce((sum, tx) => sum + tx.amount, 0) / 14;
    
    const dailySpend: Record<string, number> = {};
    for (const tx of last14DaysTxs) {
        const day = new Date(tx.ts).toISOString().split('T')[0];
        dailySpend[day] = (dailySpend[day] || 0) + tx.amount;
    }

    const spikeDay = Object.entries(dailySpend).find(([, total]) => total > avgDailySpend * 2.5);
    if (!spikeDay) return null;

    const [dateStr, amount] = spikeDay;
    const friendlyDate = new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });

    return {
        id: 'spending-spike',
        icon: TrendingUpIcon,
        title: 'Spending Spike',
        text: `Your spending on **${friendlyDate}** was **${formatCurrency(amount)}**, which is higher than your recent average.`,
    };
};

const analyzeMoodSpending = (data: AppData): SmartInsight | null => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTxs = data.transactions.filter(tx => tx.ts >= startOfMonth.getTime());
    if (thisMonthTxs.length < 5) return null;

    const impulseTotal = thisMonthTxs.filter(tx => JSON.parse(tx.tags_json).includes('impulse')).reduce((sum, tx) => sum + tx.amount, 0);
    if (impulseTotal === 0) return null;
    
    const total = thisMonthTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const impulsePercentage = (impulseTotal / total) * 100;
    
    if (impulsePercentage < 15) return null;

    return {
        id: 'mood-spending',
        icon: LightbulbIcon,
        title: 'Mindful Spending',
        text: `This month, **${Math.round(impulsePercentage)}%** of your spending was on impulse buys, totaling **${formatCurrency(impulseTotal)}**.`,
    };
};

const getSmartInsight = (): SmartInsight | null => {
    const data: AppData = {
        transactions: dbService.getTransactions(),
        goals: dbService.getGoals(),
    };
    
    const insightFunctions = [
        analyzeTopCategory,
        analyzeGoalProgress,
        analyzeSpendingSpike,
        analyzeMoodSpending,
    ];
    
    // Shuffle and find the first valid insight
    for (const fn of insightFunctions.sort(() => Math.random() - 0.5)) {
        const result = fn(data);
        if (result) return result;
    }
    
    // Fallback insight
    return {
        id: 'default-tip',
        icon: LightbulbIcon,
        title: 'Daily Tip',
        text: "Review your subscriptions regularly. You might find services you no longer need!",
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
    goals: Goal[];
}

const getPeriodData = (period: 'month' | 'week' | 'day', transactions: Transaction[], offset: number = 0) => {
    const now = new Date();
    const startOfPeriod = new Date(now);
    
    if (period === 'month') {
        startOfPeriod.setMonth(now.getMonth() - offset, 1);
    } else if (period === 'week') {
        startOfPeriod.setDate(now.getDate() - now.getDay() - (offset * 7));
    } else { // day
        startOfPeriod.setDate(now.getDate() - offset);
    }
    startOfPeriod.setHours(0, 0, 0, 0);

    const endOfPeriod = new Date(startOfPeriod);
     if (period === 'month') {
        endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
    } else if (period === 'week') {
        endOfPeriod.setDate(endOfPeriod.getDate() + 7);
    } else { // day
        endOfPeriod.setDate(endOfPeriod.getDate() + 1);
    }
    endOfPeriod.setMilliseconds(-1);

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
    
    const filterByCategory = (txs: Transaction[]) => category === 'all' ? txs : txs.filter(tx => tx.category.toLowerCase() === category.toLowerCase());

    const currentTotal = filterByCategory(currentPeriodTxs).reduce((sum, tx) => sum + tx.amount, 0);
    const previousTotal = filterByCategory(previousPeriodTxs).reduce((sum, tx) => sum + tx.amount, 0);

    const categoryText = category === 'all' ? 'total spending' : `spending on **${category}**`;

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
        return "I can do a few things, all offline:\n- Give you **Smart Insights** on your spending.\n- **Analyse your spending** for a day, week, month or year.\n- **Compare spending** between this month and last month.\n- Show you your **biggest category**.\n- Give you **saving tips** based on your habits.\n- Explain financial topics like **SIP, PPF, or credit scores**.\n- Calculate **loan EMIs** or **SIP returns**.\n- Help you find features like **how to edit a transaction**.";
    }

    return "I'm not sure about that. Try asking 'help' to see what I can do.";
};

const getSmallTalkResponse = (query: string, kb: any): {text: string, actions: MintorAction[]} | null => {
    if (!kb?.smallTalk) return null;
    const lowerQuery = query.toLowerCase().replace(/[^\w\s]/gi, '');
    const smallTalk = kb.smallTalk;
    for (const key in smallTalk) {
        if (key.split('|').some(keyword => lowerQuery.trim().includes(keyword))) {
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
        case 'Transactions':
             return [
                { label: 'Compare spending: this month vs last', type: 'query', payload: 'Compare my total spending this month vs last month' },
                { label: 'How do I edit a transaction?', type: 'query', payload: 'How do I edit a transaction?' },
                { label: 'Export my data', type: 'query', payload: 'How do I export my data?' },
                { label: 'Show me my impulse buys', type: 'query', payload: 'Show impulse buys' },
            ];
        case 'Insights':
            return [
                 { label: 'Compare food spending', type: 'query', payload: 'Compare food spending this month vs last month' },
                 { label: 'Busiest spending day?', type: 'query', payload: 'Which day of the week do I spend most?' },
                 { label: 'What is a credit score?', type: 'query', payload: 'What is a credit score?' },
                 ...defaults,
            ];
        case 'Goals':
            return [
                { label: 'How can I save faster?', type: 'query', payload: 'How can I save money faster?' },
                { label: 'What is a good savings rate?', type: 'query', payload: 'What is a good savings rate?' },
                { label: 'What is an SIP?', type: 'query', payload: 'What is SIP?' },
                { label: 'How do I link a transaction?', type: 'query', payload: 'How do I link a transaction to a goal?' },
            ];
        default:
             return [
                ...defaults,
                { label: 'What is an emergency fund?', type: 'query', payload: 'What is an emergency fund?' },
                { label: 'How do I edit a transaction?', type: 'query', payload: 'How do I edit a transaction?' },
            ];
    }
}


export const mintorAiService = {
    getSmartInsight,
    getContextualStartingPrompts,
    generateWeeklyDigest,
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

        // Fix: Explicitly type the intents array to ensure correct type inference for MintorAction.
        const intents: Array<{
            regex: RegExp;
            handler: ((matches: string[]) => string) | ((matches: string[], data: MintorData) => string);
            actions?: MintorAction[];
        }> = [
            {
                regex: /emi for.*?([\d,]+).*?(\d+(\.\d+)?)% for (\d+)/i,
                handler: (matches: string[]) => calculateEMI(parseFloat(matches[1].replace(/,/g, '')), parseFloat(matches[2]), parseFloat(matches[4]))
            },
            {
                regex: /sip.*?([\d,]+) for (\d+).*?(\d+(\.\d+)?)%/i,
                handler: (matches: string[]) => calculateSIP(parseFloat(matches[1].replace(/,/g, '')), parseFloat(matches[3]), parseFloat(matches[2]))
            },
            {
                regex: /compare (my |my total )?(.*?) spending (this|current) (month|week) vs (last|previous)/i,
                handler: (matches: string[], data: MintorData) => {
                    const category = matches[2].trim() || 'all';
                    const period = matches[4] as 'month' | 'week';
                    return compareSpending(category, period, data);
                },
                actions: [{ label: 'Open Insights', type: 'navigate', payload: 'Insights' }]
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
                regex: /what is (sip|ppf|fd|emergency fund|credit score|debt snowball|mutual fund|nps|elss|etf|tax|index fund|debt avalanche)|what can you do|help/i,
                handler: (matches: string[]) => getKBAnswer(matches[0], kb)
            },
            {
                regex: /tell me about (this app|sentimint)|who made you|about sentimint/i,
                handler: (matches: string[]) => getKBAnswer(matches[0], kb, 'sentimint'),
                actions: [{ label: 'Open About Page', type: 'navigate', payload: 'Settings' }]
            },
            {
                regex: /(edit|delete|link).*? transaction|set a goal|export csv|delete data|change theme|import csv|generate report|search/i,
                handler: (matches: string[]) => getKBAnswer(matches[0], kb)
            },
        ];

        for (const intent of intents) {
            const match = query.toLowerCase().match(intent.regex);
            if (match) {
                const handler = intent.handler;
                // FIX: The TypeScript compiler cannot narrow the handler's union type based on its `length` property. An explicit check with type assertions is used to ensure the correct function signature is called.
                let text: string;
                if (handler.length === 2) {
                    text = (handler as (matches: string[], data: MintorData) => string)(match, data);
                } else {
                    text = (handler as (matches: string[]) => string)(match);
                }
                return {
                    sender: 'bot',
                    text,
                    actions: intent.actions || []
                };
            }
        }
        
        return {
            sender: 'bot',
            text: getKBAnswer(query.toLowerCase(), kb),
        };
    }
};