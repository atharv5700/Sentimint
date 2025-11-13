import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIX: Updated import paths to be relative.
import { useAppContext } from '../App';
import { SearchIcon, CloseIcon, TransactionsIcon, GoalsIcon, MOOD_MAP } from '../constants';
import type { Transaction, Budget } from '../types';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TransactionResult: React.FC<{ tx: Transaction, onClick: () => void }> = ({ tx, onClick }) => {
    const { formatCurrency } = useAppContext();
    const moodInfo = MOOD_MAP[tx.mood];
    const MoodIcon = moodInfo.icon;

    const moodBgColor = 
        tx.mood === 1 ? 'bg-red-500/20' : 
        tx.mood === 2 ? 'bg-amber-500/20' :
        tx.mood === 3 ? 'bg-slate-500/20' :
        tx.mood === 4 ? 'bg-teal-500/20' :
        'bg-emerald-500/20';
    
    const moodIconColor = 
        tx.mood === 1 ? 'text-red-500' : 
        tx.mood === 2 ? 'text-amber-500' :
        tx.mood === 3 ? 'text-slate-500' :
        tx.mood === 4 ? 'text-teal-5