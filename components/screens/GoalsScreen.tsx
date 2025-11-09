import React, { useState, useMemo, useEffect } from 'react';
import type { Goal, Budget } from '../../types';
import { useAppContext } from '../../App';
import { PlusIcon, TrashIcon, CheckIcon, PencilIcon, DEFAULT_CATEGORIES, CloseIcon } from '../../constants';
import { hapticClick, hapticError } from '../../services/haptics';
import ProgressBar from '../ProgressBar';
import CustomSelect from '../CustomSelect';


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
                <div className="flex-1 ml-4">
                    <div className="flex justify-between items-start">
                        <span className="text-title-m font-medium text-on-surface-variant break-all">{goal.title}</span>
                         <div className="flex items-center">
                             <button onClick={() => { hapticClick(); onEdit(goal); }} className="text-on-surface-variant/50 hover:text-primary p-1"><PencilIcon className="w-5 h-5" /></button>
                             <button onClick={() => { hapticClick(); deleteGoal(goal.id); }} className="text-on-surface-variant/50 hover:text-error p-1"><TrashIcon className="w-5 h-5" /></button>
                         </div>
                    </div>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-body-m text-on-surface font-bold">{formatCurrency(goal.current_amount)}</span>
                        <span className="text-label-s text-on-surface-variant">of {formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="flex justify-between text-label-s text-on-surface-variant mt-1">
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
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-3xl" onClick={onClose}>
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
    const { addGoal, updateGoal } = useAppContext();
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [emoji, setEmoji] = useState('🎯');
    const [deadline, setDeadline] = useState('');
    const [dateInputType, setDateInputType] = useState('text');
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

    const isFormValid = title.trim().length > 0 && parseFloat(targetAmount) > 0;

    const handleSave = () => {
        if (!isFormValid) { hapticError(); return; }
        const amount = parseFloat(targetAmount);
        const deadline_ts = deadline ? new Date(deadline).getTime() : null;
        
        const goalData = { title: title.trim(), target_amount: amount, emoji, deadline_ts };

        if(goalToEdit) {
            updateGoal({ ...goalToEdit, ...goalData });
        } else {
            addGoal(goalData);
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
            <div className="relative bg-surface rounded-3xl p-6 w-full max-w-sm animate-modalSlideUp overflow-hidden">
                <h2 className="text-headline-m mb-4">{goalToEdit ? 'Edit' : 'New'} Goal</h2>
                <div className="space-y-4">
                     <div className="flex gap-2">
                        <button type="button" onClick={() => { hapticClick(); setIsPickerOpen(true); }} className="w-16 h-14 text-center text-3xl bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                            {emoji}
                        </button>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal Title" className="flex-1 w-full bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                     </div>
                     <input type="text" inputMode="numeric" value={targetAmount ? new Intl.NumberFormat('en-IN').format(parseFloat(targetAmount)) : ''} onChange={e => setTargetAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Target Amount (₹)" className="w-full bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="relative">
                         <input 
                            type={dateInputType}
                            value={deadline} 
                            onChange={e => setDeadline(e.target.value)} 
                            onFocus={() => setDateInputType('date')}
                            onBlur={() => { if(!deadline) setDateInputType('text')}}
                            placeholder="Deadline (Optional)"
                            className={`w-full bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${!deadline && dateInputType === 'text' ? 'text-on-surface-variant' : 'text-on-surface'}`}
                         />
                         {dateInputType === 'date' && (
                             <style>{`
                                input[type="date"]::-webkit-calendar-picker-indicator {
                                    filter: invert(var(--is-dark));
                                    opacity: 0.8;
                                    cursor: pointer;
                                    position: absolute;
                                    right: 0.75rem;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    width: 1.5rem;
                                    height: 1.5rem;
                                }
                             `}</style>
                         )}
                     </div>

                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { hapticClick(); onClose(); }} className="px-4 py-2 rounded-full text-primary">Cancel</button>
                    <button onClick={handleSave} disabled={!isFormValid} className="px-6 py-2 rounded-full bg-primary text-on-primary disabled:bg-outline">Save</button>
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
        <div onClick={() => onEdit(budget)} className="bg-surface-variant p-4 rounded-3xl cursor-pointer hover:bg-surface-variant/80 transition-colors">
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
    
    const availableCategories = useMemo(() => DEFAULT_CATEGORIES.filter(cat => 
        !budgets.some(b => b.category === cat) || (budgetToEdit && budgetToEdit.category === cat)
    ), [budgets, budgetToEdit]);
    
    const [category, setCategory] = useState(budgetToEdit ? budgetToEdit.category : (availableCategories[0] || ''));
    const [amount, setAmount] = useState(budgetToEdit ? String(budgetToEdit.amount) : '');
    
    const isFormValid = parseFloat(amount) > 0 && category;

    const handleSave = () => {
        if (!isFormValid) { hapticError(); return; }
        const budgetData = { category, amount: parseFloat(amount) };
        if (budgetToEdit) {
            updateBudget({ ...budgetData, id: budgetToEdit.id, created_at: budgetToEdit.created_at });
        } else {
            addBudget(budgetData);
        }
        onClose();
    };
    
    const categoryOptions = (budgetToEdit ? [{value: budgetToEdit.category, label: budgetToEdit.category}] : []).concat(availableCategories.map(c => ({value: c, label: c})));

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-backdropFadeIn">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm animate-modalSlideUp">
                <h2 className="text-headline-m mb-4">{budgetToEdit ? 'Edit' : 'New'} Budget</h2>
                <div className="space-y-4">
                    <CustomSelect 
                        value={category}
                        onChange={(val) => setCategory(val as string)}
                        options={categoryOptions}
                        disabled={!!budgetToEdit}
                    />
                    <input type="text" inputMode="numeric" value={amount ? new Intl.NumberFormat('en-IN').format(parseFloat(amount)) : ''} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Budget Amount (₹)" className="w-full bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { hapticClick(); onClose(); }} className="px-4 py-2 rounded-full text-primary">Cancel</button>
                    <button onClick={handleSave} disabled={!isFormValid} className="px-6 py-2 rounded-full bg-primary text-on-primary disabled:bg-outline">Save</button>
                </div>
            </div>
        </div>
    );
};


export default function GoalsScreen() {
    const { goals, budgets, transactions } = useAppContext();
    const [activeTab, setActiveTab] = useState<'goals' | 'budgets'>('goals');
    
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

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
    const handleAddNewGoal = () => { setEditingGoal(null); setGoalModalOpen(true); };
    const handleEditBudget = (budget: Budget) => { setEditingBudget(budget); setBudgetModalOpen(true); };
    const handleAddNewBudget = () => { setEditingBudget(null); setBudgetModalOpen(true); };
    
    const handleFabClick = () => {
        hapticClick();
        if (activeTab === 'goals') handleAddNewGoal();
        else handleAddNewBudget();
    };

    return (
        <div className="relative min-h-full">
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
            
            <button onClick={handleFabClick} className="fixed bottom-24 right-6 bg-primary-container text-on-primary-container rounded-2xl shadow-lg w-14 h-14 flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-modalSlideUp z-10">
                <PlusIcon className="w-7 h-7" />
            </button>
            
            {isGoalModalOpen && <GoalModal onClose={() => setGoalModalOpen(false)} goalToEdit={editingGoal} />}
            {isBudgetModalOpen && <BudgetModal onClose={() => setBudgetModalOpen(false)} budgetToEdit={editingBudget} />}
        </div>
    );
}