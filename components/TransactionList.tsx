import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Transaction, Goal } from '../types';
import { useAppContext } from '../App';
import { MOOD_MAP, TrashIcon, TagIcon, LinkIcon, CloseIcon, DEFAULT_TAGS } from '../constants';

const TransactionCard: React.FC<{ 
    tx: Transaction, 
    onEdit: (tx: Transaction) => void,
    onSelect: (id: string, isLongPress: boolean) => void,
    isSelected: boolean,
    isBulkMode: boolean
}> = ({ tx, onEdit, onSelect, isSelected, isBulkMode }) => {
    const { formatCurrency } = useAppContext();
    const cardRef = useRef<HTMLDivElement>(null);
    const longPressTimeout = useRef<number | null>(null);

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent context menu on long press on desktop
        e.preventDefault();
        longPressTimeout.current = window.setTimeout(() => {
            onSelect(tx.id, true);
            longPressTimeout.current = null;
        }, 500); // 500ms for long press
    };
    
    const handlePressEnd = () => {
        if(longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
            // It was a short press (click)
            if (isBulkMode) {
                onSelect(tx.id, false);
            } else {
                onEdit(tx);
            }
        }
    };

    const moodInfo = MOOD_MAP[tx.mood];

    return (
        <div 
            ref={cardRef}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex items-start p-3 my-2 bg-surface rounded-2xl shadow-sm transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-secondary-container' : 'bg-surface'}`}
        >
            {isBulkMode && (
                <div className="mr-3 self-center">
                    <input 
                        type="checkbox" 
                        checked={isSelected} 
                        readOnly 
                        className="h-5 w-5 rounded text-primary focus:ring-primary accent-primary"
                    />
                </div>
            )}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant text-lg">
                <moodInfo.icon className={`w-7 h-7 ${moodInfo.color}`} />
            </div>
            <div className="flex-1 ml-4">
                <p className="font-medium text-on-surface">{tx.merchant || tx.category}</p>
                <p className="text-sm text-on-surface-variant">{tx.category}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-on-surface">{formatCurrency(tx.amount)}</p>

                <p className="text-xs text-on-surface-variant">{new Date(tx.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
        </div>
    );
};

const BulkActionToolbar: React.FC<{ selectedIds: string[], onClear: () => void, transactions: Transaction[] }> = ({ selectedIds, onClear, transactions }) => {
    const { deleteTransactions, updateTransaction, goals } = useAppContext();
    const [showTagModal, setShowTagModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    if (selectedIds.length === 0) return null;
    
    const applyTags = (tagsToApply: string[]) => {
        selectedIds.forEach(id => {
            const tx = transactions.find(t => t.id === id);
            if (tx) {
                const existingTags = JSON.parse(tx.tags_json || '[]');
                const newTags = [...new Set([...existingTags, ...tagsToApply])];
                updateTransaction({ ...tx, tags_json: JSON.stringify(newTags) });
            }
        });
        onClear();
    };
    
    const linkToGoal = (goalId: string | null) => {
         selectedIds.forEach(id => {
            const tx = transactions.find(t => t.id === id);
            if (tx) {
                updateTransaction({ ...tx, goal_id: goalId });
            }
        });
        onClear();
    }

    return (
        <>
            <div className="fixed bottom-20 left-0 right-0 bg-inverse-surface text-inverse-on-surface p-2 flex justify-between items-center shadow-lg animate-slideUp z-20">
                <span className="font-medium ml-2">{selectedIds.length} selected</span>
                <div className="flex gap-1 items-center">
                    <button onClick={() => setShowTagModal(true)} className="p-2 rounded-full hover:bg-white/10" aria-label="Tag selected"><TagIcon/></button>
                    <button onClick={() => setShowLinkModal(true)} className="p-2 rounded-full hover:bg-white/10" aria-label="Link selected"><LinkIcon/></button>
                    <button onClick={() => { deleteTransactions(selectedIds); onClear(); }} className="p-2 rounded-full hover:bg-white/10" aria-label="Delete selected"><TrashIcon/></button>
                    <button onClick={onClear} className="p-2 rounded-full" aria-label="Done"><CloseIcon /></button>
                </div>
            </div>
            {showTagModal && <TagModal onApply={applyTags} onClose={() => setShowTagModal(false)} />}
            {showLinkModal && <LinkGoalModal goals={goals} onLink={linkToGoal} onClose={() => setShowLinkModal(false)} />}
        </>
    );
};

const TagModal: React.FC<{onApply: (tags: string[]) => void, onClose: () => void}> = ({ onApply, onClose }) => {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm">
                <h3 className="text-headline-m mb-4">Add Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {DEFAULT_TAGS.map(tag => (
                        <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-sm ${selectedTags.includes(tag) ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{tag}</button>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-primary">Cancel</button>
                    <button onClick={() => onApply(selectedTags)} className="px-6 py-2 bg-primary text-on-primary rounded-full">Apply</button>
                </div>
            </div>
        </div>
    );
}

const LinkGoalModal: React.FC<{goals: Goal[], onLink: (goalId: string | null) => void, onClose: () => void}> = ({ goals, onLink, onClose }) => {
    const [selectedGoal, setSelectedGoal] = useState<string|null>(null);
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm">
                <h3 className="text-headline-m mb-4">Link to Goal</h3>
                <select value={selectedGoal || ''} onChange={(e) => setSelectedGoal(e.target.value || null)} className="w-full bg-surface-variant p-3 rounded-lg appearance-none">
                    <option value="">None</option>
                    {goals.filter(g => !g.completed_bool).map(goal => <option key={goal.id} value={goal.id}>{goal.emoji} {goal.title}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-primary">Cancel</button>
                    <button onClick={() => onLink(selectedGoal)} className="px-6 py-2 bg-primary text-on-primary rounded-full">Link</button>
                </div>
            </div>
        </div>
    )
}

export default function TransactionList({ transactions, onEditTransaction, showDate, isBulkSelectEnabled, onBulkModeChange }: {
    transactions: Transaction[],
    onEditTransaction: (tx: Transaction) => void,
    showDate?: boolean,
    isBulkSelectEnabled?: boolean,
    onBulkModeChange?: (isActive: boolean) => void
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const isBulkMode = selectedIds.length > 0;

    useEffect(() => {
        onBulkModeChange?.(isBulkMode);
    }, [isBulkMode, onBulkModeChange]);
    
    const toggleSelection = (id: string, isLongPress: boolean) => {
        if (!isBulkSelectEnabled) return;
        if (isLongPress && !isBulkMode) {
             setSelectedIds([id]);
             return;
        }
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    
    const transactionsByMonth = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const month = new Date(tx.ts).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(tx);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [transactions]);
    
    if (transactions.length === 0) {
        return <div className="text-center p-8 text-on-surface-variant">No transactions found.</div>;
    }

    return (
        <div>
            {Object.entries(transactionsByMonth).map(([month, txs]) => (
                <div key={month} className="mb-4">
                    <h3 className="sticky top-16 bg-background/80 backdrop-blur-sm z-10 py-2 text-title-m font-medium text-on-surface-variant">{month}</h3>
                    {txs.map(tx => (
                        <TransactionCard 
                            key={tx.id} 
                            tx={tx} 
                            onEdit={onEditTransaction}
                            onSelect={toggleSelection}
                            isSelected={selectedIds.includes(tx.id)}
                            isBulkMode={isBulkSelectEnabled && isBulkMode}
                        />
                    ))}
                </div>
            ))}
            {isBulkSelectEnabled && <BulkActionToolbar selectedIds={selectedIds} onClear={() => setSelectedIds([])} transactions={transactions}/>}
        </div>
    );
}