import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Mood, RecurringTransaction } from '../../types';
import { useAppContext } from '../../App';
import TransactionList from '../TransactionList';
import { SearchIcon, ChevronDownIcon, DEFAULT_CATEGORIES, MOOD_MAP, PencilIcon, TrashIcon } from '../../constants';
import CustomSelect from '../CustomSelect';
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


interface TransactionsScreenProps {
    onEditTransaction: (tx: Transaction) => void;
}

export default function TransactionsScreen({ onEditTransaction }: TransactionsScreenProps) {
    const { transactions, recurringTransactions, setIsBulkMode, setFabConfig, openRecurringTransactionModal, openTransactionModal, openExportModal } = useAppContext();
    const [activeTab, setActiveTab] = useState<'transactions' | 'recurring'>('transactions');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ category: string; mood: string }>({ category: '', mood: '' });
    
    const categoryOptions = [{value: '', label: 'All Categories'}, ...DEFAULT_CATEGORIES.map(c => ({value: c, label: c}))];
    const moodOptions = [{value: '', label: 'All Moods'}, ...Object.entries(MOOD_MAP).map(([level, {label}]) => ({value: level, label}))];
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


    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const searchMatch = (
                tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.note.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const categoryMatch = filters.category ? tx.category === filters.category : true;
            const moodMatch = filters.mood ? tx.mood === (parseInt(filters.mood) as Mood) : true;
            
            return searchMatch && categoryMatch && moodMatch;
        });
    }, [transactions, searchTerm, filters]);
    
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
                            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-20 pt-4 pb-2 space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-surface-variant text-on-surface-variant rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <SearchIcon className="text-on-surface-variant" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <CustomSelect
                                        value={filters.category}
                                        onChange={value => setFilters(f => ({...f, category: value as string}))}
                                        options={categoryOptions}
                                    />
                                    <CustomSelect
                                        value={filters.mood}
                                        onChange={value => setFilters(f => ({...f, mood: value as string}))}
                                        options={moodOptions}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={openExportModal} className="text-primary font-medium text-sm px-3 py-1">Export CSV</button>
                                </div>
                            </div>
                            {filteredTransactions.length > 0 ? (
                                <TransactionList 
                                    transactions={filteredTransactions}
                                    onEditTransaction={onEditTransaction}
                                    showDate={true}
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