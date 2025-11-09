import type { Transaction, Goal, MintorAiMessage, MintorAction, CoachingTip, AppContextType, Screen } from '../types';
import { dbService } from './db';
import { ChartBarIcon, LightbulbIcon, TrendingUpIcon, TrophyIcon, DEFAULT_CATEGORIES } from '../constants';

let kbData: any = null;
const getKbData = async () => {
    if (kbData) return kbData;
    try {
        const response = await fetch('/assets/kb/mintor_kb.json');
        if (!response.ok) throw new Error('Failed to fetch knowledge base');
        kbData = await response.json();
        return kbData;
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

type AppData = Pick<AppContextType, 'transactions' | 'goals'>;

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
        action: { label: 'See Insights', type: 'navigate', payload: 'Insights' }
    };
};

const analyzeGoalProgress = (data: AppData): CoachingTip | null => {
    const activeGoals = data.goals.filter(g => !g.completed_bool);
    if (activeGoals.length === 0) return null;

    const goal = activeGoals.sort((a, b) => (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount))[0];
    const progress = (goal.current_amount / goal.target_amount) * 100;

    if (progress < 10) return null; // Only show for goals with some progress

    return {
        id: 'goal-progress',
        icon: TrophyIcon,
        title: 'Goal Progress',
        text: `You're **${Math.floor(progress)}%** of the way to your "**${goal.title}**" goal. Keep up the great work!`,
        action: { label: 'View Goals', type: 'navigate', payload: 'Goals' }
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

const getCoachingTip = (): CoachingTip | null => {
    const data: AppData = {
        transactions: dbService.getTransactions(),
        goals: dbService.getGoals(),
    };
    
    const tipFunctions = [
        analyzeTopCategory,
        analyzeGoalProgress,
        analyzeFrequentSpending,
        analyzeWeekdaySpending,
    ];
    
    // Shuffle and find the first valid tip
    for (const fn of tipFunctions.sort(() => Math.random() - 0.5)) {
        const result = fn(data);
        if (result) return result;
    }
    
    // Fallback tip
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


// --- Mintor AI Chat Logic (Offline) ---

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

const calculateSIP = (monthlyInvestment: number, rate: number, years: number): string => {
    const i = rate / 12 / 100;
    const n = years * 12;
    const futureValue = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    return `A monthly SIP of ${formatCurrency(monthlyInvestment)} at an expected ${rate}% return for ${years} years could grow to approximately **${formatCurrency(futureValue)}**.`;
};

const getKBAnswer = (topic: string, kb: any): string => {
    if (!kb) return "Sorry, my knowledge base is currently unavailable.";
    const lowerTopic = topic.toLowerCase().trim();
    
    const allKBs = { ...kb.greetingsAndChitChat, ...kb.financeGeneral, ...kb.howToApp, ...kb.appAbout };
    
    for (const key in allKBs) {
        const entry = allKBs[key];
        if (entry.keywords.some((k: string) => lowerTopic.includes(k))) {
            if (entry.answers) { // It's an array of possible answers
                return entry.answers[Math.floor(Math.random() * entry.answers.length)];
            }
            return entry.answer; // It's a single answer
        }
    }
    
    return `I'm not sure about "${topic}". Try asking 'help' to see what I can do.`;
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
    getCoachingTip,
    getContextualStartingPrompts,
    generateWeeklyDigest,
    getResponse: async (query: string): Promise<Omit<MintorAiMessage, 'id'>> => {
        try {
            const kb = await getKbData();
            const data: MintorData = {
                transactions: dbService.getTransactions(),
                goals: dbService.getGoals(),
            };
            const lowerQuery = query.toLowerCase();
            let resultText = "";

            const periodMatch = lowerQuery.match(/day|week|month/);
            const detectedPeriod = (periodMatch ? periodMatch[0] : 'month') as 'day' | 'week' | 'month';

            // Function-calling logic based on keywords
            if (lowerQuery.includes('analyze') || lowerQuery.includes('spending summary') || (lowerQuery.includes('how much') && lowerQuery.includes('spend'))) {
                if (lowerQuery.includes('compare')) {
                     const allCategories = [...DEFAULT_CATEGORIES, ...dbService.getCustomCategories(), 'all', 'total'];
                     const foundCategory = allCategories.find(cat => lowerQuery.includes(cat.toLowerCase())) || 'all';
                     const comparePeriod = detectedPeriod === 'day' ? 'week' : detectedPeriod;
                     resultText = compareSpending(foundCategory, comparePeriod, data);
                } else {
                    resultText = analyzeSpending(detectedPeriod, data);
                }
            } 
            else if (lowerQuery.includes('biggest') || lowerQuery.includes('top expense') || lowerQuery.includes('most spent on')) {
                resultText = getBiggestCategory(detectedPeriod, data);
            }
            else if (lowerQuery.includes('tip')) {
                resultText = getSavingTips(data, kb);
            }
            else if (lowerQuery.includes('emi') || lowerQuery.includes('loan')) {
                const nums = lowerQuery.replace(/,/g, '').match(/\d+(\.\d+)?/g)?.map(Number);
                if (nums && nums.length >= 3) {
                     resultText = calculateEMI(nums[0], nums[1], nums[2]);
                } else {
                     resultText = "To calculate EMI, please provide Principal, Rate (%), and Years. E.g., 'EMI for 500000 at 8% for 20 years'";
                }
            }
            else if (lowerQuery.includes('sip') || lowerQuery.includes('investment return')) {
                 const nums = lowerQuery.replace(/,/g, '').match(/\d+(\.\d+)?/g)?.map(Number);
                if (nums && nums.length >= 3) {
                     resultText = calculateSIP(nums[0], nums[1], nums[2]);
                } else {
                    resultText = "To calculate SIP returns, please provide Monthly Investment, Rate (%), and Years. E.g., 'SIP of 5000 at 12% for 10 years'";
                }
            }
            else {
                // If no function keyword matches, fall back to KB
                resultText = getKBAnswer(lowerQuery, kb);
            }

            return { sender: 'bot', text: resultText, actions: [] };

        } catch (error) {
            console.error("Error getting response from offline AI service:", error);
            return {
                sender: 'bot',
                text: "I'm having a little trouble thinking right now. Please try a different question.",
                actions: []
            };
        }
    }
};
