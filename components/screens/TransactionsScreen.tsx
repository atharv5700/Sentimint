import React, { useState, useMemo } from 'react';
import type { Transaction, Mood } from '../../types';
import { useAppContext } from '../../App';
import TransactionList from '../TransactionList';
import { SearchIcon, ChevronDownIcon, DEFAULT_CATEGORIES, MOOD_MAP } from '../../constants';
import { dbService } from '../../services/db';
import { ExportDataModal } from './SettingsScreen';
import CustomSelect from '../CustomSelect';

interface TransactionsScreenProps {
    onEditTransaction: (tx: Transaction) => void;
}

export default function TransactionsScreen({ onEditTransaction }: TransactionsScreenProps) {
    const { transactions, setIsBulkMode } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ category: string; mood: string }>({ category: '', mood: '' });
    const [showExportModal, setShowExportModal] = useState(false);
    const [csvData, setCsvData] = useState('');
    
    const categoryOptions = [{value: '', label: 'All Categories'}, ...DEFAULT_CATEGORIES.map(c => ({value: c, label: c}))];
    const moodOptions = [{value: '', label: 'All Moods'}, ...Object.entries(MOOD_MAP).map(([level, {label}]) => ({value: level, label}))];

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
    
    const handleExport = () => {
        try {
            const csv = dbService.exportToCsv();
            setCsvData(csv);
            setShowExportModal(true);
        } catch(e) {
            console.error("Failed to prepare export data", e);
            alert("Error preparing data for export. Please try again.");
        }
    };

    return (
        <div className="p-4">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2 space-y-2 animate-screenFadeIn" style={{animationDelay: '50ms'}}>
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
                    <button onClick={handleExport} className="text-primary font-medium text-sm px-3 py-1">Export CSV</button>
                </div>
            </div>

            <div className="animate-screenFadeIn" style={{animationDelay: '150ms'}}>
                <TransactionList 
                    transactions={filteredTransactions}
                    onEditTransaction={onEditTransaction}
                    showDate={true}
                    isBulkSelectEnabled={true}
                    onBulkModeChange={setIsBulkMode}
                />
            </div>
             {showExportModal && <ExportDataModal csvData={csvData} onClose={() => setShowExportModal(false)} />}
        </div>
    );
}