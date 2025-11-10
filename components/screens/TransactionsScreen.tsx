import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Transaction, Mood, RecurringTransaction } from '../../types';
import { useAppContext } from '../../App';
import TransactionList from '../TransactionList';
import { SearchIcon, ChevronDownIcon, DEFAULT_CATEGORIES, MOOD_MAP, PencilIcon, TrashIcon } from '../../constants';
import { hapticClick } from '../../services/haptics';
import { EmptyState } from '../EmptyState';

const RecurringTransactionItem: React.FC<{ rTx: RecurringTransaction }> = ({ rTx }) => {
    const { formatCurrency, deleteRecurringTransaction, openRecurringTransactionModal } = useAppContext();
    return (
        <div className="bg-surface p-3 my-2 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
                <p className="font-medium text-on-surface">{rTx.title}</p>
                <p className="text-sm text-on-surface-variant">{formatCurrency(rTx.amount)} / {rTx.frequency}</p>
            </div>
            <div>
                 <button onClick={() => { hapticClick(); openRecurringTransactionModal(rTx); }} className="text-on-surface-variant/70 hover:text-primary p-1"><PencilIcon className="w-5 h-5" /></button>
                <button onClick={() => { hapticClick(); deleteRecurringTransaction(rTx.id); }} className="text-on-surface-variant/70 hover:text-error p-1"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

const Dropdown: React.FC<{
    options: { value: string; label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    placeholder: string;
}> = ({ options, selectedValue, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => { hapticClick(); setIsOpen(!isOpen); }}
                className="flex items-center justify-between gap-1 w-full text-sm font-medium rounded-full transition-colors duration-200 px-4 py-2.5 bg-surface text-on-surface shadow-sm"
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDownIcon className={`w-4 h-4 text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-black/60 backdrop-blur-lg rounded-2xl shadow-lg z-30 p-2 animate-screenFadeIn">
                    <ul className="max-h-48 overflow-y-auto">
                        {options.map(opt => (
                            <li key={opt.value}>
                                <button
                                    onClick={() => {
                                        hapticClick();
                                        onSelect(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors text-white/90 ${selectedValue === opt.value ? 'bg-mint/20 text-mint font-medium' : 'hover:bg-white/10'}`}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface TransactionsScreenProps {
    onEditTransaction: (tx: Transaction) => void;
}

type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function TransactionsScreen({ onEditTransaction }: TransactionsScreenProps) {
    const { transactions, recurringTransactions, setIsBulkMode, setFabConfig, openRecurringTransactionModal, openTransactionModal, customCategories } = useAppContext();
    const [activeTab, setActiveTab] = useState<'transactions' | 'recurring'>('transactions');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ category: string; mood: string }>({ category: '', mood: '' });
    const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
    
    const categoryOptions = [{ value: '', label: 'All Categories' }, ...[...DEFAULT_CATEGORIES, ...customCategories].map(c => ({ value: c, label: c }))];
    const moodOptions = [{value: '', label: 'All Moods'}, ...Object.entries(MOOD_MAP).map(([level, {label}]) => ({value: level, label}))];
    const sortOptions = [
        { value: 'date-desc', label: 'Newest First' },
        { value: 'date-asc', label: 'Oldest First' },
        { value: 'amount-desc', label: 'Amount (High-Low)' },
        { value: 'amount-asc', label: 'Amount (Low-High)' },
    ];
    const hasFilters = filters.category || filters.mood || searchTerm;

    useEffect(() => {
        const fabAction = () => {
            hapticClick();
            if (activeTab === 'transactions') {
                openTransactionModal(null);
            } else {
                openRecurringTransactionModal(null);
            }
        };
        
        setFabConfig({
            onClick: fabAction,
            'aria-label': activeTab === 'transactions' ? 'Add Transaction' : 'Add Recurring Transaction'
        });

        return () => setFabConfig(null);
    }, [activeTab, setFabConfig, openTransactionModal, openRecurringTransactionModal]);


    const sortedTransactions = useMemo(() => {
        const filtered = transactions.filter(tx => {
            const searchMatch = (
                tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.note.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const categoryMatch = filters.category ? tx.category === filters.category : true;
            const moodMatch = filters.mood ? tx.mood === (parseInt(filters.mood) as Mood) : true;
            
            return searchMatch && categoryMatch && moodMatch;
        });

        return [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case 'date-asc': return a.ts - b.ts;
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                case 'date-desc':
                default:
                    return b.ts - a.ts;
            }
        });

    }, [transactions, searchTerm, filters, sortOrder]);

    return (
        <div className="relative">
            <div className="p-4">
                <div className="flex justify-center p-1 bg-surface-variant/50 rounded-full mx-auto max-w-sm">
                    {(['transactions', 'recurring'] as const).map(tab => (
                        <button key={tab} onClick={() => { hapticClick(); setActiveTab(tab); }} className={`w-full capitalize px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${activeTab === tab ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div key={activeTab} className="animate-screenFadeIn">
                    {activeTab === 'transactions' ? (
                        <>
                            <div className="sticky top-0 bg-background/60 backdrop-blur-lg z-20 pt-4 pb-2 -mx-4 px-4">
                                <div className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl space-y-3">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant h-6 w-6" />
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-surface text-on-surface rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/70"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                        <div className="w-full sm:flex-1">
                                            <Dropdown
                                                placeholder="Category"
                                                options={categoryOptions}
                                                selectedValue={filters.category}
                                                onSelect={(value) => setFilters(f => ({...f, category: value}))}
                                            />
                                        </div>
                                        <div className="w-full sm:flex-1">
                                            <Dropdown
                                                placeholder="Mood"
                                                options={moodOptions}
                                                selectedValue={filters.mood}
                                                onSelect={(value) => setFilters(f => ({...f, mood: value}))}
                                            />
                                        </div>
                                        <div className="w-full sm:flex-1">
                                            <Dropdown
                                                placeholder="Sort"
                                                options={sortOptions}
                                                selectedValue={sortOrder}
                                                onSelect={(value) => setSortOrder(value as SortOrder)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {sortedTransactions.length > 0 ? (
                                <TransactionList 
                                    transactions={sortedTransactions}
                                    onEditTransaction={onEditTransaction}
                                    sortOrder={sortOrder}
                                    isBulkSelectEnabled={true}
                                    onBulkModeChange={setIsBulkMode}
                                />
                            ) : (
                                <div className="pt-8">
                                    <EmptyState
                                        icon={hasFilters ? "search" : "box"}
                                        title={hasFilters ? "No Results Found" : "No Transactions Yet"}
                                        message={hasFilters ? "Try adjusting your search or filters to find what you're looking for." : "Tap the plus button below to add your first transaction."}
                                        action={(transactions.length === 0 && !hasFilters) ? {
                                            label: "Add First Transaction",
                                            onClick: () => { hapticClick(); openTransactionModal(null); }
                                        } : undefined}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 text-center text-body-m text-on-surface-variant">
                                Manage automated bills and subscriptions.
                            </div>
                            {recurringTransactions.length > 0 ? (
                                <div className="stagger-children">
                                    {recurringTransactions.map((rTx, i) => (
                                        <div key={rTx.id} style={{ '--stagger-delay': i } as React.CSSProperties}>
                                            <RecurringTransactionItem rTx={rTx} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                 <EmptyState
                                    icon="box"
                                    title="No Recurring Transactions"
                                    message="Set up recurring payments like rent or subscriptions to track them automatically."
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}