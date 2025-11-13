import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Budget, Challenge, UserChallenge } from '../../types';
import { useAppContext } from '../../App';
import { ALL_CHALLENGES } from '../../data/challenges';
import { PlusIcon, TrashIcon, CheckIcon, CloseIcon, CHALLENGE_BADGE_MAP, DEFAULT_CATEGORIES } from '../../constants';
import { hapticClick, hapticError } from '../../services/haptics';
import ProgressBar from '../ProgressBar';
import { EmptyState } from '../EmptyState';
import SegmentedControl from '../SegmentedControl';

export const GoalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // This component is no longer used but kept in the file to avoid breaking the export.
    // It will be removed in a future cleanup.
    return null;
}

const BudgetListItem: React.FC<{ budget: Budget, spent: number, onEdit: (budget: Budget) => void }> = ({ budget, spent, onEdit }) => {
    const { formatCurrency, deleteBudget } = useAppContext();
    const progress = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;
    
    return (
        <div onClick={() => { hapticClick(); onEdit(budget); }} className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl cursor-pointer hover:bg-surface-variant/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-on-surface-variant">{budget.category}</span>
                <button onClick={(e) => { e.stopPropagation(); hapticClick(); deleteBudget(budget.id); }} className="text-on-surface-variant/50 hover:text-error p-1"><TrashIcon className="w-5 h-5"/></button>
            </div>
            <ProgressBar progress={progress} />
            <div className="flex justify-between text-sm mt-1">
                <span className="text-on-surface-variant">{formatCurrency(spent)} of {formatCurrency(budget.amount)}</span>
                <span className={remaining < 0 ? 'text-error font-medium' : 'text-primary'}>
                    {formatCurrency(Math.abs(remaining))} {remaining < 0 ? 'over' : 'left'}
                </span>
            </div>
        </div>
    );
};

export const BudgetModal: React.FC<{ onClose: () => void, budgetToEdit: Budget | null }> = ({ onClose, budgetToEdit }) => {
    const { addBudget, updateBudget, budgets, customCategories } = useAppContext();
    
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');

    const availableCategories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories].filter(cat => 
        !budgets.some(b => b.category === cat) || (budgetToEdit && budgetToEdit.category === cat)
    ), [budgets, budgetToEdit, customCategories]);
    
    useEffect(() => {
        if (budgetToEdit) {
            setCategory(budgetToEdit.category);
            setAmount(String(budgetToEdit.amount));
        } else {
            setCategory('');
            setAmount('');
        }
    }, [budgetToEdit]);
    
    const isFormValid = parseFloat(amount.replace(/,/g, '')) > 0 && !!category;

    const handleSave = () => {
        if (!isFormValid) { hapticError(); return; }
        const budgetAmount = parseFloat(amount.replace(/,/g, ''));
        const budgetData = { category, amount: budgetAmount };
        if (budgetToEdit) {
            updateBudget({ ...budgetData, id: budgetToEdit.id, created_at: budgetToEdit.created_at });
        } else {
            addBudget(budgetData);
        }
        onClose();
    };

    const formattedAmount = useMemo(() => {
        if (!amount) return '';
        const numericAmount = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('en-IN').format(numericAmount);
    }, [amount]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">{budgetToEdit ? 'Edit' : 'New'} Budget</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="p-3 rounded-full text-on-surface-variant hover:bg-surface-variant/80 transition-colors" aria-label="Close add budget modal">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="overflow-y-auto px-2 sm:px-0 pb-4 space-y-6">
                    <div>
                        <label className="text-label-s text-on-surface-variant">Budget Amount</label>
                        <input 
                            type="text" 
                            inputMode="decimal" 
                            placeholder="₹0" 
                            value={amount ? `₹${formattedAmount}` : ''} 
                            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                            className="w-full text-4xl sm:text-display-l bg-transparent focus:outline-none p-0 border-0"
                        />
                    </div>

                    <div>
                         <label className="text-label-s text-on-surface-variant mb-1 block">Category</label>
                         {budgetToEdit ? (
                            <div className="inline-block px-3 py-1.5 rounded-lg text-sm bg-tertiary-container text-on-tertiary-container cursor-not-allowed">
                                {budgetToEdit.category}
                            </div>
                         ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableCategories.length > 0 ? availableCategories.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => { hapticClick(); setCategory(cat); }} 
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${category === cat ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                                    >
                                        {cat}
                                    </button>
                                )) : <p className="text-sm text-on-surface-variant">All categories have budgets.</p>}
                            </div>
                         )}
                    </div>
                </div>
                
                <div className="pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                    <button onClick={handleSave} disabled={!isFormValid} className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant">Save</button>
                </div>
            </div>
        </div>
    );
};

export default function GoalsScreen() {
    const { budgets, transactions, setFabConfig, openBudgetModal, userChallenges, startChallenge, formatCurrency } = useAppContext();
    const [activeTab, setActiveTab] = useState<'budgets' | 'challenges'>('budgets');

    const monthlySpending = useMemo(() => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyTxs = transactions.filter(tx => tx.ts >= startOfMonth.getTime());
        return budgets.reduce((acc, budget) => {
            acc[budget.id] = monthlyTxs.filter(tx => tx.category === budget.category).reduce((sum, tx) => sum + tx.amount, 0);
            return acc;
        }, {} as Record<string, number>);
    }, [transactions, budgets]);

    const handleEditBudget = (budget: Budget) => openBudgetModal(budget);
    const handleAddNewBudget = useCallback(() => { hapticClick(); openBudgetModal(null); }, [openBudgetModal]);

    useEffect(() => {
        if (activeTab === 'budgets') {
            setFabConfig({ onClick: handleAddNewBudget, 'aria-label': 'Add new budget' });
        } else {
            setFabConfig(null);
        }
        
        return () => {
            setFabConfig(null);
        };
    }, [activeTab, setFabConfig, handleAddNewBudget]);
    
    const { activeChallenges, completedChallenges, availableChallenges } = useMemo(() => {
        const active = userChallenges.filter(uc => uc.status === 'active').map(uc => ({...uc, ...ALL_CHALLENGES.find(c => c.id === uc.challengeId)!}));
        const completed = userChallenges.filter(uc => uc.status === 'completed').map(uc => ({...uc, ...ALL_CHALLENGES.find(c => c.id === uc.challengeId)!}));
        
        const activeChallengeIds = userChallenges.filter(uc => uc.status === 'active').map(uc => uc.challengeId);
        const available = ALL_CHALLENGES.filter(c => !activeChallengeIds.includes(c.id));
        
        return { activeChallenges: active, completedChallenges: completed, availableChallenges: available };
    }, [userChallenges]);

    const ActiveChallengeCard: React.FC<{ challenge: UserChallenge & Challenge, style?: React.CSSProperties }> = ({ challenge, style }) => {
        const BadgeIcon = CHALLENGE_BADGE_MAP[challenge.badgeIcon] || CHALLENGE_BADGE_MAP['default'];
        let progress = 0;
        let progressText = "Keep going!";

        if (challenge.type === 'spendLimitOnCategory') {
            progress = (challenge.progress / challenge.targetValue) * 100;
            const verb = 'Spent';
            progressText = `${verb} ${formatCurrency(challenge.progress)} / ${formatCurrency(challenge.targetValue)}`;
        } else if (challenge.type === 'noSpendOnCategory') {
            const daysPassed = Math.max(0, (Date.now() - challenge.startDate) / (1000 * 60 * 60 * 24));
            progress = (daysPassed / challenge.durationDays) * 100;
            const daysRemaining = Math.max(0, Math.ceil(challenge.durationDays - daysPassed));
            progressText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to go!`;
        }

        return (
            <div style={style} className="bg-gradient-to-br from-secondary-container/50 to-primary-container/50 p-4 rounded-3xl">
                <div className="flex items-start gap-4">
                    <div className="bg-surface/50 rounded-full p-3 mt-1">
                        <BadgeIcon className="w-6 h-6 text-on-surface-variant" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-title-m font-medium text-on-surface-variant">{challenge.title}</h4>
                        <p className="text-body-m text-on-surface-variant/80 mt-1">{challenge.description}</p>
                        <div className="mt-4">
                            <ProgressBar progress={progress} />
                            <p className="text-sm font-medium text-on-surface-variant mt-1.5">{progressText}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AvailableChallengeCard: React.FC<{ challenge: Challenge, style?: React.CSSProperties }> = ({ challenge, style }) => {
        const { startChallenge } = useAppContext();
        const [isStarted, setIsStarted] = useState(false);
        const BadgeIcon = CHALLENGE_BADGE_MAP[challenge.badgeIcon] || CHALLENGE_BADGE_MAP['default'];
    
        const handleStart = () => {
            if (isStarted) return;
            setIsStarted(true);
            // Delay the actual state update to allow for animation
            setTimeout(() => {
                startChallenge(challenge.id);
            }, 350);
        };
    
        return (
            <div 
                style={style}
                className={`bg-surface-variant p-4 rounded-3xl transition-all duration-300 ${isStarted ? 'opacity-0 scale-95' : ''}`}>
                <div className="flex items-start gap-4">
                    <div className="bg-surface/50 rounded-full p-3 mt-1 flex-shrink-0">
                        <BadgeIcon className="w-6 h-6 text-on-surface-variant" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-title-m font-medium text-on-surface-variant">{challenge.title}</h4>
                        <p className="text-body-m text-on-surface-variant/80 mt-1">{challenge.description}</p>
                        <button 
                            onClick={handleStart} 
                            disabled={isStarted}
                            className={`w-full mt-4 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 ${isStarted ? 'bg-primary/20 text-primary' : 'bg-primary/20 dark:bg-primary/30 backdrop-blur-lg border border-primary/40 dark:border-primary/60 text-primary'}`}
                        >
                            {isStarted ? (
                                <div className="flex items-center justify-center gap-2 animate-screenFadeIn">
                                    <CheckIcon className="w-5 h-5 animate-check-pop" /> Challenge Accepted!
                                </div>
                            ) : (
                                'Start Challenge'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const AchievementBadge: React.FC<{ challenge: UserChallenge & Challenge }> = ({ challenge }) => {
        const BadgeIcon = CHALLENGE_BADGE_MAP[challenge.badgeIcon] || CHALLENGE_BADGE_MAP['default'];
        return (
            <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-tertiary-container rounded-full flex items-center justify-center">
                    <BadgeIcon className="w-10 h-10 text-on-tertiary-container" />
                </div>
                <h5 className="text-sm font-medium mt-2">{challenge.title}</h5>
                <p className="text-xs text-on-surface-variant">Completed</p>
            </div>
        );
    };


    return (
        <div className="relative min-h-full">
            <div className="px-4">
                 <div className="mb-4 max-w-sm mx-auto">
                    <SegmentedControl
                        options={[
                            { label: 'Budgets', value: 'budgets' },
                            { label: 'Challenges', value: 'challenges' }
                        ]}
                        selected={activeTab}
                        onSelect={(val) => setActiveTab(val as 'budgets' | 'challenges')}
                    />
                </div>

                <div key={activeTab} className="animate-screenFadeIn">
                    {activeTab === 'budgets' && (
                         <div className="space-y-4 stagger-children">
                            {budgets.length > 0 ? (
                                budgets.map((budget, i) => <div key={budget.id} style={{ '--stagger-delay': i } as React.CSSProperties}><BudgetListItem budget={budget} spent={monthlySpending[budget.id] || 0} onEdit={handleEditBudget} /></div>)
                            ) : (
                                <EmptyState
                                    icon="goal"
                                    title="Create a Budget"
                                    message="Budgets help you stay on top of your spending in different categories."
                                />
                            )}
                        </div>
                    )}
                     {activeTab === 'challenges' && (
                         <div className="space-y-6">
                            {activeChallenges.length > 0 && (
                                <div>
                                    <h2 className="text-title-m font-medium mb-2">Active Challenge</h2>
                                    <div className="space-y-4 stagger-children">
                                        {activeChallenges.map((c, i) => <ActiveChallengeCard key={c.challengeId} challenge={c} style={{'--stagger-delay': i} as React.CSSProperties} />)}
                                    </div>
                                </div>
                            )}
                             <div>
                                <h2 className="text-title-m font-medium mb-2">Available Challenges</h2>
                                <div className="space-y-4 stagger-children">
                                    {availableChallenges.length > 0 ? availableChallenges.map((c, i) => <AvailableChallengeCard key={c.id} challenge={c} style={{'--stagger-delay': i} as React.CSSProperties}/>)
                                    : <p className="text-body-m text-on-surface-variant text-center py-4">You've attempted all available challenges. Check back later for more!</p>}
                                </div>
                            </div>
                             {completedChallenges.length > 0 && (
                                <div>
                                    <h2 className="text-title-m font-medium mb-2">Achievements</h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4 bg-surface-variant rounded-3xl">
                                        {completedChallenges.map(c => <AchievementBadge key={c.challengeId} challenge={c} />)}
                                    </div>
                                </div>
                             )}
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}
