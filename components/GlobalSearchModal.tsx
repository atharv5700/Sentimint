import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../App';
import { SearchIcon, CloseIcon, TransactionsIcon, GoalsIcon, MOOD_MAP } from '../constants';
import type { Transaction, Goal, Budget } from '../types';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TransactionResult: React.FC<{ tx: Transaction, onClick: () => void }> = ({ tx, onClick }) => {
    const { formatCurrency } = useAppContext();
    const MoodIcon = MOOD_MAP[tx.mood].icon;
    return (
        <li onClick={onClick} className="flex items-center p-3 rounded-lg hover:bg-surface-variant cursor-pointer">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-surface">
                 <MoodIcon className={`w-5 h-5 ${MOOD_MAP[tx.mood].color}`} />
            </div>
            <div className="flex-1 ml-3 min-w-0">
                <p className="font-medium text-on-surface truncate">{tx.merchant || tx.category}</p>
                <p className="text-sm text-on-surface-variant">{new Date(tx.ts).toLocaleDateString()}</p>
            </div>
            <p className="font-bold text-on-surface">{formatCurrency(tx.amount)}</p>
        </li>
    );
};

const GoalResult: React.FC<{ goal: Goal, onClick: () => void }> = ({ goal, onClick }) => (
    <li onClick={onClick} className="flex items-center p-3 rounded-lg hover:bg-surface-variant cursor-pointer">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-surface">
             <GoalsIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 ml-3 min-w-0">
            <p className="font-medium text-on-surface truncate">{goal.title}</p>
            <p className="text-sm text-on-surface-variant">Goal</p>
        </div>
    </li>
);

const BudgetResult: React.FC<{ budget: Budget, onClick: () => void }> = ({ budget, onClick }) => (
    <li onClick={onClick} className="flex items-center p-3 rounded-lg hover:bg-surface-variant cursor-pointer">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-surface">
             <TransactionsIcon className="w-5 h-5 text-secondary" />
        </div>
        <div className="flex-1 ml-3 min-w-0">
            <p className="font-medium text-on-surface truncate">{budget.category} Budget</p>
             <p className="text-sm text-on-surface-variant">Budget</p>
        </div>
    </li>
);


export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
    const { transactions, goals, budgets, setScreen, openTransactionModal, openGoalModal, openBudgetModal } = useAppContext();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery(''); // Reset query on close
        }
    }, [isOpen]);

    const searchResults = useMemo(() => {
        if (!query.trim()) return null;
        const q = query.toLowerCase();

        const txResults = transactions.filter(tx =>
            tx.merchant.toLowerCase().includes(q) ||
            tx.category.toLowerCase().includes(q) ||
            tx.note.toLowerCase().includes(q)
        ).slice(0, 10);

        const goalResults = goals.filter(g =>
            g.title.toLowerCase().includes(q)
        ).slice(0, 5);

        const budgetResults = budgets.filter(b =>
            b.category.toLowerCase().includes(q)
        ).slice(0, 5);
        
        return { txResults, goalResults, budgetResults };
    }, [query, transactions, goals, budgets]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-screenFadeIn">
            <header 
                className="flex items-center gap-4 p-4"
                style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
            >
                 <div className="flex items-center flex-grow h-12 px-4 bg-transparent border-2 border-primary rounded-full">
                    <SearchIcon className="text-on-surface-variant w-5 h-5 mr-2 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full h-full bg-transparent text-on-surface focus:outline-none placeholder:text-on-surface-variant/80 text-base"
                    />
                </div>
                <button onClick={onClose} className="text-primary font-medium text-base flex items-center flex-shrink-0">Cancel</button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4">
                {!searchResults && <p className="text-center text-on-surface-variant mt-8">Start typing to search.</p>}
                
                {searchResults && (
                    <div className="space-y-6">
                        {searchResults.txResults.length > 0 && (
                            <section>
                                <h2 className="text-title-m font-medium mb-2">Transactions</h2>
                                <ul className="space-y-1">
                                    {searchResults.txResults.map(tx => (
                                        <TransactionResult key={tx.id} tx={tx} onClick={() => { openTransactionModal(tx); onClose(); }} />
                                    ))}
                                </ul>
                            </section>
                        )}
                        {searchResults.goalResults.length > 0 && (
                            <section>
                                <h2 className="text-title-m font-medium mb-2">Goals</h2>
                                <ul className="space-y-1">
                                    {searchResults.goalResults.map(goal => (
                                        <GoalResult key={goal.id} goal={goal} onClick={() => { setScreen('Goals'); onClose(); }} />
                                    ))}
                                </ul>
                            </section>
                        )}
                         {searchResults.budgetResults.length > 0 && (
                            <section>
                                <h2 className="text-title-m font-medium mb-2">Budgets</h2>
                                <ul className="space-y-1">
                                    {searchResults.budgetResults.map(budget => (
                                        <BudgetResult key={budget.id} budget={budget} onClick={() => { setScreen('Goals'); onClose(); }} />
                                    ))}
                                </ul>
                            </section>
                        )}

                        {searchResults.txResults.length === 0 && searchResults.goalResults.length === 0 && searchResults.budgetResults.length === 0 && (
                             <p className="text-center text-on-surface-variant mt-8">No results found for "{query}"</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}