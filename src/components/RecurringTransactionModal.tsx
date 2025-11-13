import React, { useState, useEffect, useMemo } from 'react';
import type { RecurringTransaction, Mood } from '../types';
import { useAppContext } from '../App';
import { DEFAULT_CATEGORIES, MOOD_MAP, CloseIcon } from '../constants';
import { hapticClick, hapticError } from 'services/haptics';

interface RecurringTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    rTxToEdit: RecurringTransaction | null;
}

export default function RecurringTransactionModal({ isOpen, onClose, rTxToEdit }: RecurringTransactionModalProps) {
    const { addRecurringTransaction, updateRecurringTransaction, theme } = useAppContext();
    
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [startDate, setStartDate] = useState('');
    const [mood, setMood] = useState<Mood>(3); // Default to Neutral

    useEffect(() => {
        if (rTxToEdit) {
            setTitle(rTxToEdit.title);
            setAmount(rTxToEdit.amount.toString());
            setCategory(rTxToEdit.category);
            setFrequency(rTxToEdit.frequency);
            setStartDate(new Date(rTxToEdit.start_date).toISOString().split('T')[0]);
            setMood(rTxToEdit.mood);
        } else {
            setTitle('');
            setAmount('');
            setCategory(DEFAULT_CATEGORIES[0]);
            setFrequency('monthly');
            setStartDate(new Date().toISOString().split('T')[0]);
            setMood(3);
        }
    }, [rTxToEdit, isOpen]);

    const isFormValid = title.trim().length > 0 && parseFloat(amount.replace(/,/g, '')) > 0 && !!startDate;
    
    const handleSave = async () => {
        if (!isFormValid) {
            hapticError();
            return;
        }
        
        const rTxData = {
            title: title.trim(),
            amount: parseFloat(amount.replace(/,/g, '')),
            currency: 'INR' as const,
            merchant: title.trim(), // Use title as merchant for simplicity
            category,
            mood,
            frequency,
            start_date: new Date(startDate).getTime(),
            note: '',
            tags_json: '[]'
        };

        if (rTxToEdit) {
            await updateRecurringTransaction({ ...rTxToEdit, ...rTxData });
        } else {
            await addRecurringTransaction(rTxData);
        }
        onClose();
    };

    if (!isOpen) return null;

    const formattedAmount = useMemo(() => {
        if (!amount) return '';
        const numericAmount = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('en-IN').format(numericAmount);
    }, [amount]);
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">{rTxToEdit ? 'Edit' : 'Add'} Recurring</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="p-3 rounded-full text-on-surface-variant hover:bg-surface-variant/80 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="overflow-y-auto pb-4 px-2 sm:px-0 space-y-4">
                    <div>
                        <label className="text-label-s text-on-surface-variant">Amount</label>
                        <input type="text" inputMode="decimal" placeholder="₹0" value={amount ? `₹${formattedAmount}` : ''} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full text-4xl sm:text-display-l bg-transparent focus:outline-none p-0 border-0"/>
                    </div>
                    <div>
                        <label className="text-label-s text-on-surface-variant">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rent, Netflix" className="w-full bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="text-label-s text-on-surface-variant mb-1 block">Frequency</label>
                        <div className="flex justify-center p-1 bg-surface-variant/50 rounded-full">
                            {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                                <button key={freq} onClick={() => { hapticClick(); setFrequency(freq); }} className={`w-full capitalize px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${frequency === freq ? 'bg-primary-container text-on-primary-container shadow' : 'text-on-surface-variant'}`}>
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                         <label className="text-label-s text-on-surface-variant">Start Date</label>
                         <input 
                            type="date"
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
                            style={{colorScheme: theme}}
                        />
                    </div>
                     <div>
                        <label className="text-label-s text-on-surface-variant mb-1 block">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => { hapticClick(); setCategory(cat); }} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${category === cat ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="text-label-s text-on-surface-variant mb-2 block">Default Mood</label>
                        <div className="grid grid-cols-5 gap-1 sm:gap-2">
                            {Object.entries(MOOD_MAP).map(([level, { label, icon: Icon }]) => (
                                <button key={level} onClick={() => { hapticClick(); setMood(parseInt(level) as Mood); }} className={`flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg transition-colors duration-200 ${mood === parseInt(level) ? 'bg-secondary-container' : 'hover:bg-surface-variant'}`}>
                                    <Icon className={`w-7 h-7 sm:w-9 sm:h-9 ${mood === parseInt(level) ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                                    <span className={`text-[10px] sm:text-label-s text-center ${mood === parseInt(level) ? 'text-on-secondary-container font-medium' : 'text-on-surface-variant'}`}>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                    <button onClick={handleSave} disabled={!isFormValid} className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant">Save</button>
                </div>
            </div>
        </div>
    );
}