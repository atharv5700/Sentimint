import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../App';
import { SearchIcon, CloseIcon, TransactionsIcon, GoalsIcon, MOOD_MAP } from '../constants';
import type { Transaction, Budget } from '../types';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TransactionResult: React.FC<{ tx: Transaction, onClick: () => void }> = ({ tx, onClick }) => {
    const { formatCurrency } = useAppContext();
    const moodInfo = MOOD_MAP[tx.mood];
    const MoodIcon = moodInfo.icon;

    const moodBgColor = 
        tx.mood === 1 ? 'bg-red-500/20' : 
        tx.mood === 2 ? 'bg-amber-500/20' :
        tx.mood === 3 ? 'bg-slate-500/20' :
        tx.mood === 4 ? 'bg-teal-500/20' :
        'bg-emerald-500/20';
    
    const moodIconColor = 
        tx.mood === 1 ? 'text-red-500' : 
        tx.mood === 2 ? 'text-amber-500' :
        tx.mood === 3 ? 'text-slate-500' :
        tx.mood === 4 ? 'text-teal-500' :
        'text-emerald-500';

    return (
        <li onClick={onClick} className="flex items-center py-3 px-1 rounded-lg hover:bg-surface-variant cursor-pointer transition-colors">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${moodBgColor}`}>
                 <MoodIcon className={`w-6 h-6 ${moodIconColor}`} />
            </div>
            <div className="flex-1 ml-4 min-w-0">
                <p className="font-medium text-on-surface truncate">{tx.merchant || tx.category}</p>
                <p className="text-sm text-on-surface-variant">{new Date(tx.ts).toLocaleDateString('en-IN', {day: 'numeric', month: 'numeric', year: 'numeric'})}</p>
            </div>
            <p className="font-bold text-on-surface text-base whitespace-nowrap">{formatCurrency(tx.amount)}</p>
        </li>
    );
};

const BudgetResult: React.FC<{ budget: Budget, onClick: () => void }> = ({ budget, onClick }) => (
    <li onClick={onClick} className="flex items-center py-3 px-1 rounded-lg hover:bg-surface-variant cursor-pointer transition-colors">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-secondary/20">
             <TransactionsIcon className="w-6 h-6 text-secondary" />
        </div>
        <div className="flex-1 ml-4 min-w-0">
            <p className="font-medium text-on-surface truncate">{budget.category} Budget</p>
             <p className="text-sm text-on-surface-variant">Budget</p>
        </div>
    </li>
);


export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
    const { transactions, budgets, setScreen, openTransactionModal } = useAppContext();
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

        const budgetResults = budgets.filter(b =>
            b.category.toLowerCase().includes(q)
        ).slice(0, 5);
        
        return { txResults, budgetResults };
    }, [query, transactions, budgets]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-backdropFadeIn" onClick={onClose}>
            <div 
                className="bg-surface w-full shadow-2xl animate-searchModalSlideDown max-h-[85vh] flex flex-col rounded-b-3xl"
                onClick={e => e.stopPropagation()}
            >
                <header 
                    className="flex items-center gap-4 p-4 flex-shrink-0"
                    style={{ paddingTop: `calc(1.25rem + env(safe-area-inset-top))` }}
                >
                     <div className="flex items-center flex-grow h-12 px-4 bg-surface-variant rounded-2xl focus-within:ring-2 focus-within:ring-primary transition-shadow">
                        <SearchIcon className="text-on-surface-variant w-5 h-5 mr-3 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search transactions, budgets..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full h-full bg-transparent text-on-surface focus:outline-none placeholder:text-on-surface-variant/80 text-base"
                        />
                    </div>
                    <button onClick={onClose} className="text-primary font-medium text-base flex-shrink-0">Cancel</button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-4 pt-0 pb-safe">
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
                             {searchResults.budgetResults.length > 0 && (
                                <section>
                                    <h2 className="text-title-m font-medium mb-2">Budgets</h2>
                                    <ul className="space-y-1">
                                        {searchResults.budgetResults.map(budget => (
                                            <BudgetResult key={budget.id} budget={budget} onClick={() => { setScreen('Budgets'); onClose(); }} />
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {searchResults.txResults.length === 0 && searchResults.budgetResults.length === 0 && (
                                 <p className="text-center text-on-surface-variant mt-8">No results found for "{query}"</p>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}