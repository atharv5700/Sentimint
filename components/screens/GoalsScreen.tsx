import React, { useState, useMemo } from 'react';
import type { Goal } from '../../types';
import { useAppContext } from '../../App';
import { PlusIcon, TrashIcon, CheckIcon } from '../../constants';

const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
    const stroke = 4;
    const radius = 30;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle
                stroke="rgb(var(--color-outline-variant))"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke="rgb(var(--color-primary))"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500"
            />
        </svg>
    );
};

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
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
                        <span className="text-title-m font-medium text-on-surface-variant">{goal.title}</span>
                         <button onClick={() => deleteGoal(goal.id)} className="text-on-surface-variant/50 hover:text-error p-1">
                            <TrashIcon className="w-5 h-5" />
                        </button>
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
             {goal.completed_bool && (
                <div className="mt-2 flex items-center gap-1 text-primary">
                    <CheckIcon className="w-4 h-4"/>
                    <span className="text-sm font-medium">Completed!</span>
                </div>
            )}
        </div>
    );
};


const AddGoalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addGoal } = useAppContext();
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [emoji, setEmoji] = useState('');
    const [deadline, setDeadline] = useState('');
    
    const isFormValid = title.trim().length > 0 && parseFloat(targetAmount) > 0;

    const handleSave = () => {
        if (!isFormValid) return;
        const amount = parseFloat(targetAmount);
        const deadline_ts = deadline ? new Date(deadline).getTime() : null;
        
        addGoal({ title, target_amount: amount, emoji: emoji || '🎯', deadline_ts });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm">
                <h2 className="text-headline-m mb-4">New Goal</h2>
                <div className="space-y-4">
                     <div className="flex gap-2">
                        <div className="relative w-16 h-14">
                           <input 
                                type="text" 
                                value={emoji} 
                                onChange={e => setEmoji(e.target.value)} 
                                maxLength={2} 
                                placeholder="🎯"
                                className="w-full h-full text-center text-3xl bg-surface-variant p-3 rounded-lg z-10 relative placeholder:text-on-surface-variant/50" 
                            />
                        </div>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal Title" className="flex-1 w-full bg-surface-variant p-3 rounded-lg" />
                     </div>
                     <input 
                        type="text" 
                        inputMode="numeric" 
                        value={targetAmount ? new Intl.NumberFormat('en-IN').format(parseFloat(targetAmount)) : ''} 
                        onChange={e => setTargetAmount(e.target.value.replace(/[^0-9]/g, ''))} 
                        placeholder="Target Amount (₹)" 
                        className="w-full bg-surface-variant p-3 rounded-lg" 
                     />
                     <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="Deadline (Optional)" className="w-full bg-surface-variant p-3 rounded-lg" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-full text-primary">Cancel</button>
                    <button onClick={handleSave} disabled={!isFormValid} className="px-6 py-2 rounded-full bg-primary text-on-primary disabled:bg-outline">Save</button>
                </div>
            </div>
        </div>
    );
}

export default function GoalsScreen() {
    const { goals } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(false);
    
    const { activeGoals, completedGoals } = useMemo(() => {
        return {
            activeGoals: goals.filter(g => !g.completed_bool),
            completedGoals: goals.filter(g => g.completed_bool)
        }
    }, [goals]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-headline-m">Your Goals</h1>
                <button onClick={() => setModalOpen(true)} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-full shadow">
                    <PlusIcon className="w-5 h-5"/>
                    New Goal
                </button>
            </div>

            <div className="space-y-4">
                {activeGoals.length > 0 && activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
                {activeGoals.length === 0 && <p className="text-center text-on-surface-variant p-8">No active goals. Create one to get started!</p>}

                {completedGoals.length > 0 && (
                    <div className="pt-8">
                        <h2 className="text-title-m font-medium mb-2">Completed</h2>
                        <div className="space-y-4">
                            {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
                        </div>
                    </div>
                )}
            </div>
            
            {isModalOpen && <AddGoalModal onClose={() => setModalOpen(false)} />}
        </div>
    );
}