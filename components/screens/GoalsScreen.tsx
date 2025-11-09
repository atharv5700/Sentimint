import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Goal, Budget } from '../../types';
import { useAppContext } from '../../App';
import { PlusIcon, TrashIcon, CheckIcon, PencilIcon, DEFAULT_CATEGORIES, CloseIcon } from '../../constants';
import { hapticClick, hapticError, hapticSuccess } from '../../services/haptics';
import ProgressBar from '../ProgressBar';


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
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">{goal.emoji}</div>
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

const GOAL_EMOJIS = ['🎯', '💰', '✈️', '🚗', '🏠', '🎓', '💻', '🎁', '❤️', '📈', '🧘', '📚', '💍', '👶', '🎸', '👟', '🖼️', '🎉'];

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => {
    return (
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex items-center justify-center p-4 rounded-[28px]" onClick={onClose}>
            <div className="bg-surface-variant rounded-2xl p-4 w-full max-w-xs animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <h3 className="text-title-m text-center mb-4 text-on-surface-variant">Choose an Icon</h3>
                <div className="grid grid-cols-6 gap-2">
                    {GOAL_EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => {
                                hapticClick();
                                onSelect(emoji);
                            }}
                            className="text-3xl p-2 rounded-full hover:bg-black/10 transition-colors"
                            aria-label={emoji}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const GoalModal: React.FC<{ onClose: () => void, goalToEdit: Goal | null }> = ({ onClose, goalToEdit }) => {
    const { addGoal, updateGoal, theme } = useAppContext();
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [emoji, setEmoji] = useState('🎯');
    const [deadline, setDeadline] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    
     useEffect(() => {
        if (goalToEdit) {
            setTitle(goalToEdit.title);
            setTargetAmount(String(goalToEdit.target_amount));
            setEmoji(goalToEdit.emoji || '🎯');
            setDeadline(goalToEdit.deadline_ts ? new Date(goalToEdit.deadline_ts).toISOString().split('T')[0] : '');
        } else {
            setTitle('');
            setTargetAmount('');
            setEmoji('🎯');
            setDeadline('');
        }
    }, [goalToEdit]);

    const isFormValid = title.trim().length > 0 && parseFloat(targetAmount.replace(/,/g, '')) > 0;

    const handleSave = () => {
        if (!isFormValid) { hapticError(); return; }
        const amount = parseFloat(targetAmount.replace(/,/g, ''));
        const deadline_ts = deadline ? new Date(deadline).getTime() : null;
        
        const goalData = { title: title.trim(), target_amount: amount, emoji, deadline_ts };

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
                
                <div className="flex-grow overflow-y-auto px-2 sm:px-0">
                    <div className="space-y-4">
                         <div>
                            <label className="text-label-s text-on-surface-variant">Target Amount</label>
                            <input type="text" inputMode="decimal" placeholder="₹0" value={targetAmount ? `₹${formattedAmount}` : ''} onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full text-4xl sm:text-display-l bg-transparent focus:outline-none p-0 border-0"/>
                        </div>
                        <div>
                            <label className="text-label-s text-on-surface-variant">Goal Title</label>
                             <div className="flex items-center gap-0 bg-surface-variant rounded-xl mt-1 focus-within:ring-2 focus-within:ring-primary">
                                <button type="button" onClick={() => { hapticClick(); setIsPickerOpen(true); }} className="h-12 w-12 text-center text-2xl p-3 flex items-center justify-center focus:outline-none rounded-l-xl hover:bg-black/5">
                                    {emoji}
                                </button>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Laptop" className="w-full bg-transparent p-3 focus:outline-none min-w-0" />
                            </div>
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
                </div>
                
                <div className="mt-6 pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                     <button onClick={handleSave} disabled={!isFormValid} className="w-full py-4 rounded-full bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant">Save</button>
                </div>

                {isPickerOpen && <EmojiPicker onSelect={(selectedEmoji) => { setEmoji(selectedEmoji); setIsPickerOpen(false); }} onClose={() => setIsPickerOpen(false)} />}
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

const BudgetModal: React.FC<{ onClose: () => void, budgetToEdit: Budget | null }> = ({ onClose, budgetToEdit }) => {
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
                
                <div className="flex-grow overflow-y-auto px-2 sm:px-0">
                    <div className="space-y-4">
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
                                            onClick={() => setCategory(cat)} 
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${category === cat ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                                        >
                                            {cat}
                                        </button>
                                    )) : <p className="text-sm text-on-surface-variant">All categories have budgets.</p>}
                                </div>
                             )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
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
    const { goals, budgets, transactions, setFabConfig } = useAppContext();
    const [activeTab, setActiveTab] = useState<'goals' | 'budgets'>('goals');
    
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
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

    const handleEditGoal = (goal: Goal) => { setEditingGoal(goal); setGoalModalOpen(true); };
    const handleAddNewGoal = useCallback(() => { setEditingGoal(null); setGoalModalOpen(true); }, []);
    const handleEditBudget = (budget: Budget) => { setEditingBudget(budget); setBudgetModalOpen(true); };
    const handleAddNewBudget = useCallback(() => { setEditingBudget(null); setBudgetModalOpen(true); }, []);
    
    const closeModal = () => {
        if (window.history.state?.modal) {
            window.history.back();
        } else {
            setGoalModalOpen(false);
            setBudgetModalOpen(false);
        }
    }

    useEffect(() => {
        const isAModalOpen = isGoalModalOpen || isBudgetModalOpen;
        
        document.body.style.overflow = isAModalOpen ? 'hidden' : 'auto';

        if (isAModalOpen) {
            setFabConfig(null);
            if (!window.history.state?.modal) {
                window.history.pushState({ modal: true }, '');
            }
        } else {
            const fabAction = () => {
                hapticClick();
                if (activeTab === 'goals') {
                    handleAddNewGoal();
                } else {
                    handleAddNewBudget();
                }
            };

            setFabConfig({
                onClick: fabAction,
                'aria-label': activeTab === 'goals' ? 'Add new goal' : 'Add new budget',
            });
        }
        
        const handlePopState = (event: PopStateEvent) => {
            setGoalModalOpen(false);
            setBudgetModalOpen(false);
        };
    
        window.addEventListener('popstate', handlePopState);
    
        return () => {
            window.removeEventListener('popstate', handlePopState);
            document.body.style.overflow = 'auto';
            setFabConfig(null);
        };
    }, [activeTab, setFabConfig, handleAddNewGoal, handleAddNewBudget, isGoalModalOpen, isBudgetModalOpen]);


    return (
        <div className="relative min-h-full">
            {celebratingGoalId && <Confetti />}
            <div className="p-4">
                <div className="flex justify-center p-1 bg-surface-variant/50 rounded-full mx-auto max-w-sm mb-6">
                    {(['goals', 'budgets'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full capitalize px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${activeTab === tab ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'goals' ? (
                    <div className="space-y-4 stagger-children">
                        {activeGoals.length > 0 && activeGoals.map((goal, i) => <div key={goal.id} style={{ '--stagger-delay': i } as React.CSSProperties}><GoalCard goal={goal} onEdit={handleEditGoal} /></div>)}
                        {activeGoals.length === 0 && <p className="text-center text-on-surface-variant p-8">No active goals. Create one to get started!</p>}
                        {completedGoals.length > 0 && (
                            <div className="pt-8">
                                <h2 className="text-title-m font-medium mb-2">Completed</h2>
                                <div className="space-y-4 stagger-children">
                                    {completedGoals.map((goal, i) => <div key={goal.id} style={{ '--stagger-delay': i + activeGoals.length } as React.CSSProperties}><GoalCard goal={goal} onEdit={handleEditGoal} /></div>)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                     <div className="space-y-4 stagger-children">
                        {budgets.length > 0 ? (
                            budgets.map((budget, i) => <div key={budget.id} style={{ '--stagger-delay': i } as React.CSSProperties}><BudgetListItem budget={budget} spent={monthlySpending[budget.id] || 0} onEdit={handleEditBudget} /></div>)
                        ) : (
                            <p className="text-center text-on-surface-variant p-8">No budgets set. Create one to get started!</p>
                        )}
                    </div>
                )}
            </div>
            
            {isGoalModalOpen && <GoalModal onClose={closeModal} goalToEdit={editingGoal} />}
            {isBudgetModalOpen && <BudgetModal onClose={closeModal} budgetToEdit={editingBudget} />}
        </div>
    );
}