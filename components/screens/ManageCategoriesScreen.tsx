import React, { useState, useMemo } from 'react';
import type { Screen } from '../../types';
import { useAppContext } from '../../App';
import { CloseIcon, PlusIcon, TrashIcon, DEFAULT_CATEGORIES } from '../../constants';
import { hapticClick, hapticError, hapticSuccess } from '../../services/haptics';

interface ManageCategoriesScreenProps {
    setScreen: (screen: Screen) => void;
}

export default function ManageCategoriesScreen({ setScreen }: ManageCategoriesScreenProps) {
    const { transactions, customCategories, addCustomCategory, deleteCustomCategory } = useAppContext();
    const [newCategory, setNewCategory] = useState('');

    const categoryUsage = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [transactions]);
    
    const handleAddCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && ![...DEFAULT_CATEGORIES, ...customCategories].some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            hapticSuccess();
            addCustomCategory(trimmed);
            setNewCategory('');
        } else {
            hapticError();
        }
    };
    
    const handleDeleteCategory = (category: string) => {
        if (!categoryUsage[category]) {
            hapticSuccess();
            deleteCustomCategory(category);
        } else {
            hapticError();
            alert("Cannot delete a category that is currently in use.");
        }
    };

    return (
        <div className="p-4 pb-24">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-headline-m">Manage Categories</h1>
                <button onClick={() => setScreen('Settings')} className="p-2">
                    <CloseIcon />
                </button>
            </header>
            
            <section className="mb-6">
                <h2 className="text-title-m font-medium mb-2 text-on-surface-variant">Add New Category</h2>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder="e.g. Education, Pets"
                        className="flex-grow bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button 
                        onClick={handleAddCategory}
                        className="bg-primary-container text-on-primary-container p-3 rounded-xl"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </section>
            
            <section className="mb-6">
                 <h2 className="text-title-m font-medium mb-2 text-on-surface-variant">Custom Categories</h2>
                 <div className="flex flex-col gap-2 stagger-children">
                    {customCategories.length > 0 ? customCategories.map((cat, i) => (
                         <div key={cat} className="flex justify-between items-center bg-surface p-3 rounded-xl" style={{'--stagger-delay': i} as React.CSSProperties}>
                            <span>{cat}</span>
                            <button 
                                onClick={() => handleDeleteCategory(cat)}
                                disabled={!!categoryUsage[cat]}
                                className="text-on-surface-variant/70 hover:text-error disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Delete category ${cat}`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )) : <p className="text-sm text-on-surface-variant p-2">You haven't added any custom categories yet.</p>}
                 </div>
            </section>

             <section>
                 <h2 className="text-title-m font-medium mb-2 text-on-surface-variant">Default Categories</h2>
                 <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map(cat => (
                         <div key={cat} className="bg-surface p-3 rounded-xl text-sm">
                            {cat}
                        </div>
                    ))}
                 </div>
            </section>
        </div>
    );
}