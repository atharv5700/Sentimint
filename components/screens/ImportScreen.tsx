import React, { useState } from 'react';
import type { Mood, Transaction } from '../../types';
import { useAppContext } from '../../App';
import { hapticClick, hapticError, hapticSuccess } from '../../services/haptics';
import { CloseIcon, DEFAULT_CATEGORIES } from '../../constants';

interface ImportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ParsedTx = Omit<Transaction, 'id' | 'currency' | 'goal_id' | 'tags_json'>;

export default function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
    const { addTransaction, refreshData } = useAppContext();
    const [fileName, setFileName] = useState('');
    const [parsedTxs, setParsedTxs] = useState<ParsedTx[]>([]);
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        hapticClick();
        setFileName(file.name);
        setError('');
        setParsedTxs([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            parseCsv(text);
        };
        reader.readAsText(file);
    };

    const parseCsv = (csvText: string) => {
        try {
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
            const requiredHeaders = ['date', 'amount', 'merchant', 'category'];
            if (!requiredHeaders.every(h => header.includes(h))) {
                throw new Error('CSV must contain date, amount, merchant, and category columns.');
            }

            const data: ParsedTx[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const tx: any = {};
                header.forEach((h, index) => tx[h] = values[index]);
                
                const ts = new Date(tx.date).getTime();
                const amount = parseFloat(tx.amount);

                if (isNaN(ts) || isNaN(amount)) {
                    console.warn(`Skipping invalid row ${i+1}:`, lines[i]);
                    continue;
                }

                data.push({
                    ts,
                    amount,
                    merchant: tx.merchant || 'Unknown',
                    category: DEFAULT_CATEGORIES.includes(tx.category) ? tx.category : 'Other',
                    mood: parseInt(tx.mood) >= 1 && parseInt(tx.mood) <= 5 ? parseInt(tx.mood) as Mood : 3,
                    note: tx.note || '',
                });
            }
            setParsedTxs(data.sort((a,b) => b.ts - a.ts));
        } catch (e: any) {
            hapticError();
            setError(e.message || 'Failed to parse CSV file.');
            console.error(e);
        }
    };
    
    const handleImport = async () => {
        if (parsedTxs.length === 0) return;
        
        hapticClick();
        setIsImporting(true);

        const txPromises = parsedTxs.map(tx => addTransaction({
            ...tx,
            currency: 'INR',
            goal_id: null,
            tags_json: '[]'
        }));
        
        await Promise.all(txPromises);
        
        setIsImporting(false);
        hapticSuccess();
        await refreshData();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">Import Transactions</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="text-on-surface-variant p-2" aria-label="Close import modal">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="overflow-y-auto px-2 sm:px-0 pb-4 space-y-4">
                    <div className="bg-surface-variant p-4 rounded-3xl space-y-4">
                        <div>
                            <h2 className="text-title-m mb-1">Instructions</h2>
                            <p className="text-body-m text-on-surface-variant">
                                Import a CSV file with columns: <strong>date, amount, merchant, category</strong>.
                                Optional columns: <strong>mood</strong> (1-5), <strong>note</strong>.
                            </p>
                        </div>
                        
                        <label className="block w-full text-center px-4 py-6 bg-surface rounded-2xl border-2 border-dashed border-outline cursor-pointer hover:border-primary">
                            <span className="text-primary font-medium">{fileName || 'Click to select a .csv file'}</span>
                            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        </label>

                        {error && <p className="text-center text-error font-medium">{error}</p>}
                    </div>

                    {parsedTxs.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-title-m mb-2">Preview ({parsedTxs.length} transactions)</h2>
                            <div className="max-h-60 overflow-y-auto bg-surface-variant p-2 rounded-2xl">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-on-surface-variant">
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Merchant</th>
                                            <th className="p-2">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedTxs.slice(0, 50).map((tx, i) => ( // Preview max 50
                                            <tr key={i} className="border-t border-outline">
                                                <td className="p-2">{new Date(tx.ts).toLocaleDateString()}</td>
                                                <td className="p-2">{tx.merchant}</td>
                                                <td className="p-2 text-right">{tx.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedTxs.length > 50 && <p className="text-center p-2 text-sm text-on-surface-variant">...and {parsedTxs.length - 50} more.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {parsedTxs.length > 0 && (
                    <div className="pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                         <button 
                            onClick={handleImport}
                            disabled={isImporting}
                            className="w-full py-4 rounded-full bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant"
                        >
                            {isImporting ? 'Importing...' : `Import ${parsedTxs.length} Transactions`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}