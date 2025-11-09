import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Goal, Budget, Challenge, UserChallenge } from '../../types';
import { useAppContext } from '../../App';
import { ALL_CHALLENGES } from '../../data/challenges';
import { PlusIcon, TrashIcon, CheckIcon, PencilIcon, DEFAULT_CATEGORIES, CloseIcon, CHALLENGE_BADGE_MAP } from '../../constants';
import { hapticClick, hapticError, hapticSuccess } from '../../services/haptics';
import ProgressBar from '../ProgressBar';
import { EmptyState } from '../EmptyState';


const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
    const stroke = 4;
    const radius = 30;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle stroke="rgb(var(--color-outline-variant))" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
            <circle stroke="rgb(var(--color-primary))" fill="transparent" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className="transition-all duration-500" />
        </svg>
    );
};

const GoalCard: React.FC<{ goal: Goal, onEdit: (goal: Goal) => void }> = ({ goal, onEdit }) => {
    const { formatCurrency, deleteGoal } = useAppContext();
    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
    const daysLeft = goal.deadline_ts ? Math.ceil((goal.deadline_ts - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className={`bg-surface-variant p-4 rounded-3xl shadow ${goal.completed_bool ? 'opacity-70' : ''}`}>
            <div className="flex items-start">
                <div className="relative w-[60px] h-[60px] flex-shrink-0">
                    <ProgressRing progress={progress} />
                    <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant font-bold text-sm">
                        {`${Math.round(progress)}%`}
                    </div>
                </div>
                <div className="flex-1 ml-4 min-w-0">
                    <div className="flex justify-between items-start">
                        <span className="text-title-m font-medium text-on-surface-variant break-words">{goal.title}</span>
                         <div className="flex items-center flex-shrink-0">
                             <button onClick={() => { hapticClick(); onEdit(goal); }} className="text-on-surface-variant/50 hover:text-primary p-1"><PencilIcon className="w-5 h-5" /></button>
                             <button onClick={() => { hapticClick(); deleteGoal(goal.id); }} className="text-on-surface-variant/50 hover:text-error p-1"><TrashIcon className="w-5 h-5" /></button>
                         </div>
                    </div>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-body-m text-on-surface font-bold">{formatCurrency(goal.current_amount)}</span>
                        <span className="text-label-s text-on-surface-variant">of {formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="mt-2">
                        <ProgressBar progress={progress} />
                    </div>
                    <div className="flex justify-between text-label-s text-on-surface-variant mt-2">
                        <span>{formatCurrency(remaining)} left</span>
                        {daysLeft !== null && <span>{daysLeft >= 0 ? `${daysLeft} days left` : 'Deadline passed'}</span>}
                    </div>
                </div>
            </div>
             {goal.completed_bool && ( <div className="mt-2 flex items-center gap-1 text-primary"><CheckIcon className="w-4 h-4"/><span className="text-sm font-medium">Completed!</span></div> )}
        </div>
    );
};

export const GoalModal: React.FC<{ onClose: () => void, goalToEdit: Goal | null }> = ({ onClose, goalToEdit }) => {
    const { addGoal, updateGoal, theme } = useAppContext();
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');

     useEffect(() => {
        if (goalToEdit) {
            setTitle(goalToEdit.title);
            setTargetAmount(String(goalToEdit.target_amount));
            setDeadline(goalToEdit.deadline_ts ? new Date(goalToEdit.deadline_ts).toISOString().split('T')[0] : '');
        } else {
            setTitle('');
            setTargetAmount('');
            setDeadline('');
        }
    }, [goalToEdit]);

    const isFormValid = title.trim().length > 0 && parseFloat(targetAmount.replace(/,/g, '')) > 0;

    const handleSave = () => {
        if (!isFormValid) { hapticError(); return; }
        const amount = parseFloat(targetAmount.replace(/,/g, ''));
        const deadline_ts = deadline ? new Date(deadline).getTime() : null;
        
        const goalData = { title: title.trim(), target_amount: amount, deadline_ts };

        if(goalToEdit) {
            updateGoal({ ...goalToEdit, ...goalData });
        } else {
            addGoal(goalData);
        }
        onClose();
    };
    
    const formattedAmount = useMemo(() => {
        if (!targetAmount) return '';
        const numericAmount = parseFloat(targetAmount.replace(/,/g, ''));
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('en-IN').format(numericAmount);
    }, [targetAmount]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="relative bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">{goalToEdit ? 'Edit' : 'New'} Goal</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="text-on-surface-variant p-2" aria-label="Close add goal modal">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="overflow-y-auto px-2 sm:px-0 pb-4 space-y-4">
                    <div>
                        <label className="text-label-s text-on-surface-variant">Target Amount</label>
                        <input type="text" inputMode="decimal" placeholder="₹0" value={targetAmount ? `₹${formattedAmount}` : ''} onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full text-4xl sm:text-display-l bg-transparent focus:outline-none p-0 border-0"/>
                    </div>
                    <div>
                        <label className="text-label-s text-on-surface-variant">Goal Title</label>
                         <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="e.g. New Laptop" 
                            className="w-full bg-surface-variant p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                    </div>
                     <div>
                         <label className="text-label-s text-on-surface-variant">Deadline (Optional)</label>
                         <input 
                            type="date"
                            value={deadline} 
                            onChange={e => setDeadline(e.target.value)}
                            className="w-full bg-surface-variant p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
                            style={{colorScheme: theme}}
                        />
                    </div>
                </div>
                
                <div className="pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                     <button onClick={handleSave} disabled={!isFormValid} className="w-full py-4 rounded-full bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant">Save</button>
                </div>
            </div>
        </div>
    );
}

const BudgetListItem: React.FC<{ budget: Budget, spent: number, onEdit: (budget: Budget) => void }> = ({ budget, spent, onEdit }) => {
    const { formatCurrency, deleteBudget } = useAppContext();
    const progress = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;
    
    return (
        <div onClick={() => { hapticClick(); onEdit(budget); }} className="bg-surface-variant p-4 rounded-3xl cursor-pointer hover:bg-surface-variant/80 transition-colors">
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
    const { addBudget, updateBudget, budgets } = useAppContext();
    
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');

    const availableCategories = useMemo(() => DEFAULT_CATEGORIES.filter(cat => 
        !budgets.some(b => b.category === cat) || (budgetToEdit && budgetToEdit.category === cat)
    ), [budgets, budgetToEdit]);
    
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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">{budgetToEdit ? 'Edit' : 'New'} Budget</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="text-on-surface-variant p-2" aria-label="Close add budget modal">
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
                    <button onClick={handleSave} disabled={!isFormValid} className="w-full py-4 rounded-full bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant">Save</button>
                </div>
            </div>
        </div>
    );
};

const Confetti: React.FC = () => {
    const confettiCount = 150;
    const colors = ['#1FC7A6', '#FF7043', '#44637D', '#FFB49E', '#65F7D6'];

    const confetti = useMemo(() => Array.from({ length: confettiCount }).map((_, i) => {
        const style: React.CSSProperties = {
            left: `${Math.random() * 100}%`,
            animation: `confetti-fall ${3 + Math.random() * 2}s ${Math.random() * 2}s linear forwards`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        };
        return <div key={i} className="confetti" style={style}></div>;
    }), []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
            {confetti}
        </div>
    );
};

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


export default function GoalsScreen() {
    const { goals, budgets, transactions, setFabConfig, openGoalModal, openBudgetModal, userChallenges, startChallenge, formatCurrency } = useAppContext();
    const [activeTab, setActiveTab] = useState<'goals' | 'budgets' | 'challenges'>('goals');
    const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null);
    const prevGoals = usePrevious(goals);

    useEffect(() => {
        if (prevGoals && prevGoals.length > 0 && goals.length > 0) {
            const justCompletedGoal = goals.find(
                g => g.completed_bool && !prevGoals.find(pg => pg.id === g.id)?.completed_bool
            );
            if (justCompletedGoal) {
                setCelebratingGoalId(justCompletedGoal.id);
                hapticSuccess();
                setTimeout(() => setCelebratingGoalId(null), 4000); // Animation duration
            }
        }
    }, [goals, prevGoals]);

    const { activeGoals, completedGoals } = useMemo(() => ({
        activeGoals: goals.filter(g => !g.completed_bool),
        completedGoals: goals.filter(g => g.completed_bool)
    }), [goals]);

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

    const handleEditGoal = (goal: Goal) => openGoalModal(goal);
    const handleAddNewGoal = useCallback(() => { hapticClick(); openGoalModal(null); }, [openGoalModal]);
    const handleEditBudget = (budget: Budget) => openBudgetModal(budget);
    const handleAddNewBudget = useCallback(() => { hapticClick(); openBudgetModal(null); }, [openBudgetModal]);

    useEffect(() => {
        let fabAction = () => {};
        let ariaLabel = '';

        if (activeTab === 'goals') {
            fabAction = handleAddNewGoal;
            ariaLabel = 'Add new goal';
        } else if (activeTab === 'budgets') {
            fabAction = handleAddNewBudget;
            ariaLabel = 'Add new budget';
        }

        if (fabAction && ariaLabel) {
            setFabConfig({ onClick: fabAction, 'aria-label': ariaLabel });
        } else {
            setFabConfig(null);
        }
        
        return () => {
            setFabConfig(null);
        };
    }, [activeTab, setFabConfig, handleAddNewGoal, handleAddNewBudget]);
    
    const { activeChallenges, completedChallenges, availableChallenges } = useMemo(() => {
        const active = userChallenges.filter(uc => uc.status === 'active').map(uc => ({...uc, ...ALL_CHALLENGES.find(c => c.id === uc.challengeId)!}));
        const completed = userChallenges.filter(uc => uc.status === 'completed').map(uc => ({...uc, ...ALL_CHALLENGES.find(c => c.id === uc.challengeId)!}));
        
        const activeChallengeIds = userChallenges.filter(uc => uc.status === 'active').map(uc => uc.challengeId);
        // A challenge is available if it's not currently active. Allows re-trying completed/failed challenges.
        const available = ALL_CHALLENGES.filter(c => !activeChallengeIds.includes(c.id));
        
        return { activeChallenges: active, completedChallenges: completed, availableChallenges: available };
    }, [userChallenges]);

    const ActiveChallengeCard: React.FC<{ challenge: UserChallenge & Challenge }> = ({ challenge }) => {
        const BadgeIcon = CHALLENGE_BADGE_MAP[challenge.badgeIcon] || CHALLENGE_BADGE_MAP['default'];
        let progress = 0;
        let progressText = "Keep going!";

        if (challenge.type === 'saveAmount' || challenge.type === 'spendLimitOnCategory') {
            progress = (challenge.progress / challenge.targetValue) * 100;
            const verb = challenge.type === 'saveAmount' ? 'Saved' : 'Spent';
            progressText = `${verb} ${formatCurrency(challenge.progress)} / ${formatCurrency(challenge.targetValue)}`;
        } else if (challenge.type === 'noSpendOnCategory') {
            const daysPassed = Math.max(0, (Date.now() - challenge.startDate) / (1000 * 60 * 60 * 24));
            progress = (daysPassed / challenge.durationDays) * 100;
            const daysRemaining = Math.max(0, Math.ceil(challenge.durationDays - daysPassed));
            progressText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to go!`;
        }

        return (
            <div className="bg-surface-variant p-4 rounded-3xl">
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

    const AvailableChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => (
        <div className="bg-surface p-4 rounded-3xl border border-outline-variant">
            <h4 className="text-title-m font-medium text-on-surface">{challenge.title}</h4>
            <p className="text-body-m text-on-surface-variant mt-1">{challenge.description}</p>
            <button onClick={() => startChallenge(challenge.id)} className="w-full mt-4 py-2 bg-primary text-on-primary rounded-full font-medium">Start Challenge</button>
        </div>
    );
    
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
            {celebratingGoalId && <Confetti />}
            <div className="p-4">
                <div className="flex justify-center p-1 bg-surface-variant/50 rounded-full mx-auto max-w-md mb-6">
                    {(['goals', 'budgets', 'challenges'] as const).map(tab => (
                        <button key={tab} onClick={() => { hapticClick(); setActiveTab(tab); }} className={`w-full capitalize px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${activeTab === tab ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div key={activeTab} className="animate-screenFadeIn">
                    {activeTab === 'goals' && (
                        <div className="space-y-4">
                            {activeGoals.length > 0 ? (
                                <div className="space-y-4 stagger-children">
                                    {activeGoals.map((goal, i) => <div key={goal.id} style={{ '--stagger-delay': i } as React.CSSProperties}><GoalCard goal={goal} onEdit={handleEditGoal} /></div>)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="goal"
                                    title={completedGoals.length > 0 ? "All Goals Achieved!" : "Set Your First Goal"}
                                    message={completedGoals.length > 0 ? "You've smashed all your previous goals. Ready for the next challenge?" : "Saving for something special? Create a goal to track your progress."}
                                />
                            )}
                            {completedGoals.length > 0 && (
                                <div className="pt-8">
                                    <h2 className="text-title-m font-medium mb-2">Completed</h2>
                                    <div className="space-y-4 stagger-children">
                                        {completedGoals.map((goal, i) => <div key={goal.id} style={{ '--stagger-delay': i + activeGoals.length } as React.CSSProperties}><GoalCard goal={goal} onEdit={handleEditGoal} /></div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                                    <div className="space-y-4">
                                        {activeChallenges.map(c => <ActiveChallengeCard key={c.challengeId} challenge={c} />)}
                                    </div>
                                </div>
                            )}
                             <div>
                                <h2 className="text-title-m font-medium mb-2">Available Challenges</h2>
                                <div className="space-y-4">
                                    {availableChallenges.length > 0 ? availableChallenges.map(c => <AvailableChallengeCard key={c.id} challenge={c} />)
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