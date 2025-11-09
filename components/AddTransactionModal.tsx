import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Transaction, Mood } from '../types';
import { useAppContext } from '../App';
import { DEFAULT_CATEGORIES, DEFAULT_TAGS, MOOD_MAP, ChevronDownIcon, PlusIcon, CloseIcon } from '../constants';
import { hapticClick, hapticError } from '../services/haptics';
import CustomSelect from './CustomSelect';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

const ImpulseNudgeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
        <div className="bg-surface rounded-3xl p-6 w-full max-w-sm text-center animate-modalSlideUp">
            <h2 className="text-headline-m mb-2">Mindful Moment</h2>
            <p className="text-body-m text-on-surface-variant mb-4">
                You've marked this as an impulse purchase. Take a moment. A quick pause can make a big difference.
            </p>
            <button onClick={() => { hapticClick(); onClose(); }} className="w-full py-3 rounded-full bg-primary text-on-primary font-bold">
                Got It
            </button>
        </div>
    </div>
);

export default function AddTransactionModal({ isOpen, onClose, transaction }: AddTransactionModalProps) {
    const { addTransaction, updateTransaction, goals } = useAppContext();
    
    const [amount, setAmount] = useState('');
    const [merchant, setMerchant] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [mood, setMood] = useState<Mood | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [goalId, setGoalId] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [showNudge, setShowNudge] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const customTagInputRef = useRef<HTMLInputElement>(null);

    const goalOptions = [{value: '', label: 'None'}, ...goals.filter(g => !g.completed_bool).map(g => ({value: g.id, label: `${g.emoji} ${g.title}`}))]

    // Available tags are now default + any custom tags for THIS transaction
    const availableTags = [...new Set([...DEFAULT_TAGS, ...tags])];

    useEffect(() => {
        if (isAddingTag) {
            customTagInputRef.current?.focus();
        }
    }, [isAddingTag]);

    useEffect(() => {
        if (transaction) {
            setAmount(transaction.amount.toString());
            setMerchant(transaction.merchant);
            setCategory(transaction.category);
            setMood(transaction.mood);
            setTags(JSON.parse(transaction.tags_json || '[]'));
            setGoalId(transaction.goal_id);
            setNote(transaction.note);
        } else {
            // Reset form for new transaction
            setAmount('');
            setMerchant('');
            setCategory(DEFAULT_CATEGORIES[0]);
            setMood(null);
            setTags([]);
            setGoalId(null);
            setNote('');
        }
        setIsAddingTag(false);
        setCustomTagInput('');
    }, [transaction, isOpen]);

    const handleTagToggle = (tag: string) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && customTagInput.trim()) {
            e.preventDefault();
            const newTag = customTagInput.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags(prev => [...prev, newTag]);
            }
            setCustomTagInput('');
            setIsAddingTag(false);
        }
    };
    
    const isFormValid = parseFloat(amount.replace(/,/g, '')) > 0 && mood !== null;
    
    const handleSave = async () => {
        if (!isFormValid) {
            hapticError();
            return;
        }
        
        const txData = {
            amount: parseFloat(amount.replace(/,/g, '')),
            currency: 'INR' as const,
            merchant: merchant.trim(),
            category,
            mood: mood!,
            tags_json: JSON.stringify(tags),
            goal_id: goalId,
            note: note.trim(),
        };

        if (transaction) {
            await updateTransaction({ ...txData, id: transaction.id, ts: transaction.ts });
        } else {
            await addTransaction(txData);
        }

        if (tags.includes('impulse') && !transaction) { // Only show nudge for new impulse buys
            setShowNudge(true);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const formattedAmount = useMemo(() => {
        if (!amount) return '';
        const numericAmount = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(numericAmount)) return '';
        return new Intl.NumberFormat('en-IN').format(numericAmount);
    }, [amount]);
    
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center transition-opacity duration-300 animate-backdropFadeIn">
                <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp">
                    <div className="flex justify-center mb-2 flex-shrink-0">
                        <div className="w-8 h-1 bg-outline rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                        <h2 className="text-headline-m">{transaction ? 'Edit' : 'Add'} Transaction</h2>
                        <button onClick={() => { hapticClick(); onClose(); }} className="text-on-surface-variant p-2" aria-label="Close add transaction modal">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="overflow-y-auto pb-4 px-2 sm:px-0 space-y-4">
                        {/* Amount */}
                        <div>
                            <label className="text-label-s text-on-surface-variant">Amount</label>
                            <input type="text" inputMode="decimal" placeholder="₹0" value={amount ? `₹${formattedAmount}` : ''} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full text-4xl sm:text-display-l bg-transparent focus:outline-none p-0 border-0"/>
                        </div>
                        {/* Merchant */}
                        <div>
                            <label className="text-label-s text-on-surface-variant">Merchant</label>
                            <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Starbucks" className="w-full bg-surface-variant p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        {/* Category */}
                        <div>
                            <label className="text-label-s text-on-surface-variant mb-1 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${category === cat ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>
                        {/* Mood */}
                        <div>
                            <label className="text-label-s text-on-surface-variant mb-2 block">How did this purchase make you feel?</label>
                            <div className="grid grid-cols-5 gap-1 sm:gap-2">
                            {Object.entries(MOOD_MAP).map(([level, { label, icon: Icon }]) => (
                                <button key={level} onClick={() => setMood(parseInt(level) as Mood)} className={`flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg transition-colors duration-200 ${mood === parseInt(level) ? 'bg-secondary-container' : 'hover:bg-surface-variant'}`}>
                                    <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${mood === parseInt(level) ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                                    <span className={`text-[10px] sm:text-label-s text-center ${mood === parseInt(level) ? 'text-on-secondary-container font-medium' : 'text-on-surface-variant'}`}>{label}</span>
                                </button>
                            ))}
                            </div>
                        </div>
                        {/* Tags */}
                        <div>
                            <label className="text-label-s text-on-surface-variant mb-1 block">Tags</label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {availableTags.map(tag => (
                                    <button key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tags.includes(tag) ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{tag}</button>
                                ))}
                                {isAddingTag ? (
                                    <input
                                        ref={customTagInputRef}
                                        type="text"
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        onKeyDown={handleCustomTag}
                                        onBlur={() => setIsAddingTag(false)}
                                        className="bg-surface-variant text-sm p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-24"
                                    />
                                ) : (
                                    <button onClick={() => setIsAddingTag(true)} className="flex items-center justify-center w-8 h-8 rounded-lg text-sm bg-surface-variant text-on-surface-variant">
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Link to Goal */}
                        <div>
                            <label className="text-label-s text-on-surface-variant mb-1 block">Link to Goal</label>
                            <CustomSelect 
                                value={goalId || ''}
                                onChange={value => setGoalId(value as string || null)}
                                options={goalOptions}
                            />
                        </div>
                        {/* Note */}
                        <div>
                            <label className="text-label-s text-on-surface-variant">Note</label>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Optional note..." className="w-full bg-surface-variant p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                        <button onClick={handleSave} disabled={!isFormValid} className="w-full py-4 rounded-full bg-primary text-on-primary font-bold disabled:bg-outline disabled:text-on-surface-variant">Save</button>
                    </div>
                </div>
            </div>
            {showNudge && <ImpulseNudgeModal onClose={() => { setShowNudge(false); onClose(); }} />}
        </>
    );
}