import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Transaction, Goal } from '../types';
import { useAppContext } from '../App';
import { MOOD_MAP, TrashIcon, TagIcon, LinkIcon, CloseIcon, DEFAULT_TAGS } from '../constants';
import { hapticClick, hapticSuccess } from '../services/haptics';
import CustomSelect from './CustomSelect';

const TransactionCard: React.FC<{ 
    tx: Transaction, 
    onEdit: (tx: Transaction) => void,
    onSelect: (id: string, isLongPress: boolean) => void,
    isSelected: boolean,
    isBulkMode: boolean,
    style?: React.CSSProperties
}> = ({ tx, onEdit, onSelect, isSelected, isBulkMode, style }) => {
    const { formatCurrency } = useAppContext();
    const longPressTimeout = useRef<number | null>(null);
    const pressStartPos = useRef<{x: number, y: number} | null>(null);
    
    const moodInfo = MOOD_MAP[tx.mood];
    const MoodIcon = moodInfo.icon;

    const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };
    
    const clearLongPress = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
        pressStartPos.current = null;
    };

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        pressStartPos.current = getEventPos(e);
        longPressTimeout.current = window.setTimeout(() => {
            hapticClick();
            onSelect(tx.id, true);
            longPressTimeout.current = null; // Prevent click after long press
            pressStartPos.current = null;
        }, 500); // 500ms for a long press
    };

    const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!pressStartPos.current) return;
        
        const currentPos = getEventPos(e);
        const distance = Math.sqrt(
            Math.pow(currentPos.x - pressStartPos.current.x, 2) +
            Math.pow(currentPos.y - pressStartPos.current.y, 2)
        );
        
        // If the user moves their finger more than 10px, it's a scroll, not a press.
        if (distance > 10) {
            clearLongPress();
        }
    };
    
    const handlePressEnd = () => {
        // If the timeout is still active, it was a short press (a click).
        if(longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
            
            if (isBulkMode) {
                onSelect(tx.id, false);
            } else {
                onEdit(tx);
            }
        }
        // Reset the starting position
        pressStartPos.current = null;
    };


    return (
        <div 
            style={style}
            onTouchStart={handlePressStart}
            onTouchMove={handlePressMove}
            onTouchEnd={handlePressEnd}
            onMouseDown={handlePressStart}
            onMouseMove={handlePressMove}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex items-center p-3 my-2 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer ${isSelected ? 'bg-secondary-container transform scale-[1.02]' : 'bg-surface'}`}
        >
            {isBulkMode && (
                <div className="mr-3 self-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-primary' : 'border-2 border-outline'}`}>
                        {isSelected && <div className="w-2 h-2 bg-on-primary rounded-full"></div>}
                    </div>
                </div>
            )}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-variant`}>
                <MoodIcon className={`w-7 h-7 ${moodInfo.color}`} />
            </div>
            <div className="flex-1 ml-4 min-w-0">
                <p className="font-medium text-on-surface truncate">{tx.merchant || tx.category}</p>
                <p className="text-sm text-on-surface-variant">{tx.category}</p>
            </div>
            <div className="text-right ml-2">
                <p className="font-bold text-on-surface whitespace-nowrap">{formatCurrency(tx.amount)}</p>
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
        hapticSuccess();
        onClear();
    };
    
    const linkToGoal = (goalId: string | null) => {
         selectedIds.forEach(id => {
            const tx = transactions.find(t => t.id === id);
            if (tx) {
                updateTransaction({ ...tx, goal_id: goalId });
            }
        });
        hapticSuccess();
        onClear();
    }

    const handleDelete = () => {
        hapticClick();
        deleteTransactions(selectedIds);
        onClear();
    };

    return (
        <>
            <div
                className="fixed bottom-0 left-0 right-0 bg-secondary-container text-on-secondary-container flex justify-between items-center shadow-lg animate-modalSlideUp z-30 px-4"
                style={{ paddingTop: '0.75rem', paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
            >
                <span className="font-medium ml-2 text-lg">{selectedIds.length} selected</span>
                <div className="flex gap-1 items-center">
                    <button onClick={() => { hapticClick(); setShowTagModal(true); }} className="p-3 rounded-full hover:bg-black/10" aria-label="Tag selected"><TagIcon className="w-6 h-6" /></button>
                    <button onClick={() => { hapticClick(); setShowLinkModal(true); }} className="p-3 rounded-full hover:bg-black/10" aria-label="Link selected"><LinkIcon className="w-6 h-6" /></button>
                    <button onClick={handleDelete} className="p-3 rounded-full hover:bg-black/10" aria-label="Delete selected"><TrashIcon className="w-6 h-6" /></button>
                    <button onClick={() => { hapticClick(); onClear(); }} className="p-3 rounded-full" aria-label="Close bulk actions"><CloseIcon className="w-6 h-6" /></button>
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
    
    const handleApply = () => {
        hapticClick();
        onApply(selectedTags);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm animate-modalSlideUp">
                <h3 className="text-headline-m mb-4">Add Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {DEFAULT_TAGS.map(tag => (
                        <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-sm ${selectedTags.includes(tag) ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{tag}</button>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { hapticClick(); onClose(); }} className="px-4 py-2 text-primary">Cancel</button>
                    <button onClick={handleApply} className="px-6 py-2 bg-primary text-on-primary rounded-full">Apply</button>
                </div>
            </div>
        </div>
    );
}

const LinkGoalModal: React.FC<{goals: Goal[], onLink: (goalId: string | null) => void, onClose: () => void}> = ({ goals, onLink, onClose }) => {
    const [selectedGoal, setSelectedGoal] = useState<string|null>(null);
    const goalOptions = [{value: '', label: 'None'}, ...(Array.isArray(goals) ? goals.filter(g => !g.completed_bool).map(g => ({value: g.id, label: g.title})) : [])];

    const handleLink = () => {
        hapticClick();
        onLink(selectedGoal);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm animate-modalSlideUp">
                <h3 className="text-headline-m mb-4">Link to Goal</h3>
                <CustomSelect
                    value={selectedGoal || ''}
                    onChange={(val) => setSelectedGoal(val as string || null)}
                    options={goalOptions}
                />
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { hapticClick(); onClose(); }} className="px-4 py-2 text-primary">Cancel</button>
                    <button onClick={handleLink} className="px-6 py-2 bg-primary text-on-primary rounded-full">Link</button>
                </div>
            </div>
        </div>
    )
}

type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function TransactionList({ transactions, onEditTransaction, sortOrder = 'date-desc', isBulkSelectEnabled, onBulkModeChange }: {
    transactions: Transaction[],
    onEditTransaction: (tx: Transaction) => void,
    sortOrder?: SortOrder,
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

        setSelectedIds(prev => {
            const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            if (newSelection.length === 0) {
                onBulkModeChange?.(false);
            }
            return newSelection;
        });
    };
    
    const isAmountSort = sortOrder.startsWith('amount');

    const transactionsByMonth = useMemo(() => {
        if (isAmountSort) return [];
        const monthMap = new Map<string, Transaction[]>();
        transactions.forEach(tx => {
            const month = new Date(tx.ts).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!monthMap.has(month)) {
                monthMap.set(month, []);
            }
            monthMap.get(month)?.push(tx);
        });
        return Array.from(monthMap.entries());
    }, [transactions, isAmountSort]);
    
    if (transactions.length === 0) {
        return <div className="text-center p-8 text-on-surface-variant">No transactions found.</div>;
    }

    return (
        <div>
            {isAmountSort ? (
                 <div className="stagger-children">
                    {transactions.map((tx, index) => (
                        <TransactionCard 
                            key={tx.id} 
                            tx={tx} 
                            onEdit={onEditTransaction}
                            onSelect={toggleSelection}
                            isSelected={selectedIds.includes(tx.id)}
                            isBulkMode={isBulkSelectEnabled ? isBulkMode : false}
                            style={{'--stagger-delay': index} as React.CSSProperties}
                        />
                    ))}
                </div>
            ) : (
                transactionsByMonth.map(([month, txs]) => (
                    <div key={month} className="mb-4">
                        <h3 className="sticky top-[164px] sm:top-[116px] bg-background/80 backdrop-blur-sm z-10 py-2 text-title-m font-medium text-on-surface-variant border-b border-outline-variant -mx-4 px-4">{month}</h3>
                        <div className="stagger-children">
                            {Array.isArray(txs) && txs.map((tx, index) => (
                                <TransactionCard 
                                    key={tx.id} 
                                    tx={tx} 
                                    onEdit={onEditTransaction}
                                    onSelect={toggleSelection}
                                    isSelected={selectedIds.includes(tx.id)}
                                    isBulkMode={isBulkSelectEnabled ? isBulkMode : false}
                                    style={{'--stagger-delay': index} as React.CSSProperties}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
            {isBulkSelectEnabled && <BulkActionToolbar selectedIds={selectedIds} onClear={() => setSelectedIds([])} transactions={transactions}/>}
        </div>
    );
}