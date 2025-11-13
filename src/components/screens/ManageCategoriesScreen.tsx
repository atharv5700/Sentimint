import React, { useState, useMemo } from 'react';
// FIX: Changed import paths to be relative
import { useAppContext } from '../../App';
import { CloseIcon, PlusIcon, TrashIcon, DEFAULT_CATEGORIES } from '../../constants';
import { hapticClick, hapticError } from '../../services/haptics';

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
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
            addCustomCategory(trimmed);
            setNewCategory('');
        } else {
            hapticError();
            if (trimmed) {
                alert(`Category "${trimmed}" already exists.`);
            }
        }
    };
    
    const handleDeleteCategory = (category: string) => {
        if (!categoryUsage[category]) {
            deleteCustomCategory(category);
        } else {
            hapticError();
            alert("Cannot delete a category that is currently in use by one or more transactions.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">Manage Categories</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="p-3 rounded-full text-on-surface-variant hover:bg-surface-variant/80 transition-colors" aria-label="Close manage categories modal">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="overflow-y-auto px-2 sm:px-0 pb-safe space-y-6">
                    <section className="bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 p-4 rounded-3xl">
                        <h2 className="text-title-m font-medium mb-2 text-on-surface-variant">Add New Category</h2>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                placeholder="e.g. Education, Pets"
                                className="flex-grow bg-surface p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                            />
                            <button 
                                onClick={() => { hapticClick(); handleAddCategory(); }}
                                className="bg-primary-container text-on-primary-container p-3 rounded-xl"
                                aria-label="Add new category"
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    </section>
                    
                    <section>
                         <h2 className="text-title-m font-medium mb-2 text-on-surface-variant">Custom Categories</h2>
                         <div className="flex flex-col gap-2 stagger-children">
                            {customCategories.length > 0 ? customCategories.map((cat, i) => (
                                 <div key={cat} className="flex justify-between items-center bg-surface p-3 rounded-xl" style={{'--stagger-delay': i