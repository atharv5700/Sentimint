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
                <div className="absolute top-full mt-2 w-full bg-surface rounded-2xl shadow-lg z-30 p-2 animate-screenFadeIn">
                    <ul className="max-h-48 overflow-y-auto">
                        {options.map(opt => (
                            <li key={opt.value}>
                                <button
                                    onClick={() => {
                                        hapticClick();
                                        onSelect(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors text-on-surface ${selectedValue === opt.value ? 'bg-primary-container text-on-primary-container font-medium' : 'hover:bg-surface-variant'}`}
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

const SegmentedControl: React.FC<{
    options: { label: string; value: string }[];
    selected: string;
    onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const selectedIndex = options.findIndex(opt => opt.value === selected);
        const selectedButton = container.children[selectedIndex + 1] as HTMLElement;
        if (selectedButton) {
            setPillStyle({
                left: `${selectedButton.offsetLeft}px`,
                width: `${selectedButton.offsetWidth}px`,
            });
        }
    }, [selected, options]);

    return (
        <div ref={containerRef} className="relative flex justify-center p-1 bg-surface-variant/50 rounded-full mx-auto max-w-sm">
            <div 
                className="absolute top-1 bottom-1 bg-primary-container rounded-full shadow transition-all duration-300 ease-out"
                style={pillStyle}
            />
            {options.map(({ label, value }) => (
                <button 
                    key={value} 
                    onClick={() => { hapticClick(); onSelect(value); }} 
                    className={`relative z-10 w-full capitalize px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${selected === value ? 'text-on-primary-container' : 'text-on-surface-variant'}`}
                >
                    {label}
                </button>
            ))}
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
             <div className="px-4">
                <SegmentedControl
                    options={[
                        { label: 'Transactions', value: 'transactions' },
                        { label: 'Recurring', value: 'recurring' }
                    ]}
                    selected={activeTab}
                    onSelect={(val) => setActiveTab(val as 'transactions' | 'recurring')}
                />

                <div key={activeTab} className="animate-screenFadeIn">
                    {activeTab === 'transactions' ? (
                        <>
                            <div className="pt-4 pb-2">
                                <div className="space-y-3">
                                     <div className="relative">
                                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant h-6 w-6" />
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-surface text-on-surface rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/70 shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <Dropdown
                                            placeholder="Category"
                                            options={categoryOptions}
                                            selectedValue={filters.category}
                                            onSelect={(value) => setFilters(f => ({...f, category: value}))}
                                        />
                                        <Dropdown
                                            placeholder="Mood"
                                            options={moodOptions}
                                            selectedValue={filters.mood}
                                            onSelect={(value) => setFilters(f => ({...f, mood: value}))}
                                        />
                                        <Dropdown
                                            placeholder="Sort"
                                            options={sortOptions}
                                            selectedValue={sortOrder}
                                            onSelect={(value) => setSortOrder(value as SortOrder)}
                                        />
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
                                    stickyHeaderOffsetClass="top-[68px]"
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
                            <div className="py-4 text-center text-body-m text-on-surface-variant">
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