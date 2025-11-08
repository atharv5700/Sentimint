import type { Transaction, Goal, MintorAiMessage, MintorAction } from '../types';
import { dbService } from './db';

// The knowledge base is now bundled directly to ensure full offline functionality and prevent module resolution errors.
const kbData = {
  "financeGeneral": {
    "sip": "A Systematic Investment Plan (SIP) is a way to invest a fixed amount of money in mutual funds at regular intervals. It helps in rupee cost averaging and disciplined investing.",
    "ppf": "Public Provident Fund (PPF) is a long-term savings scheme backed by the Indian government. It offers a fixed, tax-free return and is a safe investment option.",
    "fd": "A Fixed Deposit (FD) is a financial instrument provided by banks which provides investors with a higher rate of interest than a regular savings account, until the given maturity date.",
    "emergency fund": "An emergency fund is money set aside to cover unexpected financial surprises, like a job loss or medical emergency. It's recommended to have 3-6 months of living expenses saved.",
    "credit score": "A credit score (like CIBIL) is a 3-digit number that represents your creditworthiness. A higher score makes it easier to get loans and credit cards at better interest rates.",
    "debt snowball": "The debt snowball method is a debt-reduction strategy where you pay off debts from smallest to largest, regardless of interest rate. The psychological win of clearing a debt provides momentum.",
    "mutual fund": "A mutual fund is a pool of money collected from many investors to invest in stocks, bonds, or other assets. They are managed by professional fund managers.",
    "nps": "The National Pension System (NPS) is a voluntary retirement savings scheme that allows subscribers to make defined contributions towards planned retirement.",
    "elss": "Equity Linked Savings Scheme (ELSS) is a type of mutual fund that helps you save taxes under Section 80C and also provides an opportunity for long-term capital appreciation.",
    "etf": "An Exchange-Traded Fund (ETF) is a type of investment fund and exchange-traded product. They are traded on stock exchanges, much like stocks."
  },
  "howToApp": {
    "edit transaction": "To edit a transaction, go to the 'Home' or 'Transactions' screen and simply tap on the transaction you wish to change. The edit screen will pop up.",
    "delete transaction": "To delete a transaction, go to the 'Home' or 'Transactions' screen. Long-press on a transaction to enter bulk-edit mode, select the ones you want to delete, and tap the trash icon.",
    "link transaction": "When you add or edit a transaction, you'll see a 'Link to Goal' dropdown. You can select any of your active goals from there to link the expense.",
    "set a goal": "Go to the 'Goals' tab and tap the 'New Goal' button. You can then set a title, target amount, emoji, and an optional deadline.",
    "export csv": "You can export all your transaction data to a CSV file from the 'Settings' page under the Data Management section. You can also export from the 'Transactions' screen.",
    "delete data": "Be careful! You can delete all your app data from the 'Settings' page in the 'Danger Zone'. This action cannot be undone.",
    "change theme": "You can switch between light and dark themes in the 'Settings' page under the 'Appearance' section."
  },
  "appAbout": {
    "sentimint": "Sentimint is your personal, offline-first finance tracker. It helps you understand the emotions behind your spending to build healthier financial habits. All your data stays on your device, ensuring complete privacy."
  },
  "savingTips": {
    "general": [
      "Track your spending for a month to see where your money goes.",
      "Create a budget and stick to it. The 50/30/20 rule is a great start (50% Needs, 30% Wants, 20% Savings).",
      "Automate your savings. Set up a recurring transfer to your savings account right after you get paid.",
      "Review your subscriptions. Cancel any you don't use regularly.",
      "Try the '30-day rule' for non-essential purchases. If you still want it after 30 days, consider buying it."
    ]
  },
  "smallTalk": {
    "hi|hello|hey": ["Hello! How can I help you with your finances today?", "Hi there! What can I do for you?", "Hey! Ready to talk about money?"],
    "how are you|hows it going": ["I'm just a set of algorithms, but I'm running perfectly! How can I assist you?", "I'm doing great, thanks for asking! What's on your mind?"],
    "thank you|thanks": ["You're welcome!", "Happy to help!", "Anytime!"],
    "bye|goodbye": ["Goodbye! Keep tracking!", "See you later!"]
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

const getSavingTips = (data: MintorData): string => {
    if (!kbData) return "Sorry, I can't access my saving tips right now.";
    const tips = [...(kbData as any).savingTips.general];
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

const getKBAnswer = (topic: string, keyOverride?: string): string => {
    if (!kbData) return "Sorry, my knowledge base is currently unavailable.";
    const lowerTopic = topic.toLowerCase();
    
    const allKBs = { ...kbData.financeGeneral, ...kbData.howToApp, ...kbData.appAbout };
    
    const key = keyOverride || Object.keys(allKBs).find(k => lowerTopic.includes(k));
    
    if (key && allKBs[key as keyof typeof allKBs]) {
        return allKBs[key as keyof typeof allKBs];
    }
    
    if (lowerTopic.includes('what can you do') || lowerTopic.includes('help')) {
        return "I can do a few things, all offline:\n- **Analyse your spending** for a day, week, month or year.\n- Show you your **biggest category**.\n- Give you **saving tips** based on your habits.\n- Explain financial topics like **SIP, PPF, or credit scores**.\n- Calculate **loan EMIs** or **SIP returns**.\n- Help you find features like **how to edit a transaction**.";
    }

    return "I'm not sure about that. Try asking 'help' to see what I can do.";
};

const getSmallTalkResponse = (query: string): {text: string, actions: MintorAction[]} | null => {
    if (!kbData) return null;
    const lowerQuery = query.toLowerCase().replace(/[^\w\s]/gi, '');
    const smallTalk = kbData.smallTalk;
    for (const key in smallTalk) {
        if (key.split('|').some(keyword => lowerQuery.trim() === keyword)) {
            const responses = smallTalk[key as keyof typeof smallTalk];
            return {
                text: responses[Math.floor(Math.random() * responses.length)],
                actions: [
                    { label: 'Analyse my spending', type: 'query', payload: 'Analyse my spending this month' },
                    { label: 'What can you do?', type: 'query', payload: 'help' }
                ]
            };
        }
    }
    return null;
}

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
        handler: (_: string[], data: MintorData) => getSavingTips(data),
        actions: [{ label: 'Create a Goal', type: 'navigate', payload: 'Goals' }]
    },
    {
        regex: /what is (sip|ppf|fd|emergency fund|credit score|debt snowball|mutual fund|nps|elss|etf)|what can you do|help/i,
        handler: (matches: string[]) => getKBAnswer(matches[0])
    },
    {
        regex: /tell me about (this app|sentimint)|who made you|about sentimint/i,
        handler: (matches: string[]) => getKBAnswer(matches[0], 'sentimint'),
        actions: [{ label: 'Open About Page', type: 'navigate', payload: 'Settings' }]
    },
    {
        regex: /(edit|delete|link).*? transaction|set a goal|export csv|delete data|change theme/i,
        handler: (matches: string[]) => getKBAnswer(matches[0])
    },
];

export const mintorAiService = {
    getResponse: async (query: string): Promise<Omit<MintorAiMessage, 'id'>> => {

        const smallTalkResponse = getSmallTalkResponse(query);
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

        for (const intent of intents) {
            const match = query.toLowerCase().match(intent.regex);
            if (match) {
                return {
                    sender: 'bot',
                    text: intent.handler(match, data),
                    actions: intent.actions as MintorAction[] || []
                };
            }
        }
        
        return {
            sender: 'bot',
            text: getKBAnswer(query.toLowerCase()),
        };
    }
};