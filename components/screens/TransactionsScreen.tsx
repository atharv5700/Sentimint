import React, { useState, useMemo } from 'react';
import type { Transaction, Mood } from '../../types';
import { useAppContext } from '../../App';
import TransactionList from '../TransactionList';
import { SearchIcon, ChevronDownIcon, DEFAULT_CATEGORIES, MOOD_MAP } from '../../constants';
import { dbService } from '../../services/db';

interface TransactionsScreenProps {
    onEditTransaction: (tx: Transaction) => void;
}

const FilterSelect: React.FC<{ value: string | number, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ value, onChange, children }) => {
    return (
        <div className="relative w-full">
            <select
                value={value}
                onChange={onChange}
                className="w-full bg-surface-variant text-on-surface-variant rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDownIcon className="text-on-surface-variant w-5 h-5" />
            </div>
        </div>
    );
};

export default function TransactionsScreen({ onEditTransaction }: TransactionsScreenProps) {
    const { transactions } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ category: string; mood: number }>({ category: '', mood: 0 });
    const [isBulkMode, setIsBulkMode] = useState(false);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const searchMatch = (
                tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.note.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const categoryMatch = filters.category ? tx.category === filters.category : true;
            const moodMatch = filters.mood ? tx.mood === (filters.mood as Mood) : true;
            
            return searchMatch && categoryMatch && moodMatch;
        });
    }, [transactions, searchTerm, filters]);
    
    const handleExport = () => {
        try {
            const csv = dbService.exportToCsv();
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'sentimint_export.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch(e) {
            console.error("Failed to export data", e);
            alert("Error exporting data. Please try again.");
        }
    };

    return (
        <div className="p-4">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2 space-y-2">
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
                    <FilterSelect
                        value={filters.category}
                        onChange={e => setFilters(f => ({...f, category: e.target.value}))}
                    >
                        <option value="">All Categories</option>
                        {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </FilterSelect>
                    <FilterSelect
                        value={filters.mood}
                        onChange={e => setFilters(f => ({...f, mood: parseInt(e.target.value)}))}
                    >
                        <option value="0">All Moods</option>
                        {Object.entries(MOOD_MAP).map(([level, { label }]) => (
                            <option key={level} value={level}>{label}</option>
                        ))}
                    </FilterSelect>
                </div>
                 <div className="flex justify-end">
                    <button onClick={handleExport} className="text-primary font-medium text-sm px-3 py-1">Export CSV</button>
                </div>
            </div>

            <TransactionList 
                transactions={filteredTransactions}
                onEditTransaction={onEditTransaction}
                showDate={true}
                isBulkSelectEnabled={true}
                onBulkModeChange={setIsBulkMode}
            />
        </div>
    );
}