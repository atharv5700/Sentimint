import type { Challenge } from '../types';

export const ALL_CHALLENGES: Challenge[] = [
    {
        id: 'no-spend-weekend',
        title: 'No-Spend Weekend',
        description: "Don't record any 'Shopping' or 'Entertainment' transactions for a full weekend (Sat & Sun).",
        type: 'noSpendOnCategory',
        durationDays: 2,
        targetValue: 0, // Not used for this type
        category: 'Shopping;Entertainment',
        badgeIcon: 'wallet-off'
    },
    {
        id: 'no-coffee-5',
        title: '5-Day Coffee Detox',
        description: 'Avoid spending in the "Food" category at merchants like "Starbucks", "Cafe Coffee Day", etc., for 5 days.',
        type: 'noSpendOnCategory',
        durationDays: 5,
        targetValue: 0,
        category: 'Food',
        badgeIcon: 'coffee-off'
    },
    {
        id: 'limit-food-delivery',
        title: 'Cut Down on Delivery',
        description: 'Spend less than ₹1,500 on merchants like "Swiggy" or "Zomato" this week.',
        type: 'spendLimitOnCategory',
        durationDays: 7,
        targetValue: 1500,
        category: 'Food',
        badgeIcon: 'fast-food-off'
    }
];