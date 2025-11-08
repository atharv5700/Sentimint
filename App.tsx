import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Screen, Theme, Transaction, Goal } from './types';
import { dbService } from './services/db';
import HomeScreen from './components/screens/HomeScreen';
import TransactionsScreen from './components/screens/TransactionsScreen';
import InsightsScreen from './components/screens/InsightsScreen';
import GoalsScreen from './components/screens/GoalsScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import BottomNav from './components/layout/BottomNav';
import TopAppBar from './components/layout/TopAppBar';
import AddTransactionModal from './components/AddTransactionModal';
import MintorAiModal from './components/MintorAiModal';

interface AppContextType {
  transactions: Transaction[];
  goals: Goal[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'ts'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'current_amount' | 'completed_bool'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  linkTransactionToGoal: (txId: string, goalId: string | null) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};


export default function App() {
    const [screen, setScreen] = useState<Screen>('Home');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [theme, setThemeState] = useState<Theme>(dbService.getTheme());
    const [isDataReady, setIsDataReady] = useState(false);
    
    const [isAddTxModalOpen, setAddTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isMintorModalOpen, setMintorModalOpen] = useState(false);

    const recalculateGoals = useCallback(() => {
        const allGoals = dbService.getGoals();
        const allTransactions = dbService.getTransactions();
        const updatedGoals = allGoals.map(g => {
            const linkedTxs = allTransactions.filter(t => t.goal_id === g.id);
            const current_amount = linkedTxs.reduce((sum, currentTx) => sum + currentTx.amount, 0);
            const completed_bool = current_amount >= g.target_amount;
            if (g.current_amount !== current_amount || g.completed_bool !== completed_bool) {
                const updatedGoal = { ...g, current_amount, completed_bool };
                dbService.updateGoal(updatedGoal);
                return updatedGoal;
            }
            return g;
        });
        setGoals(updatedGoals.sort((a, b) => a.completed_bool ? 1 : -1));
    }, []);

    const loadData = useCallback(async () => {
        await dbService.init();
        setTransactions(dbService.getTransactions());
        recalculateGoals();
        setIsDataReady(true);
    }, [recalculateGoals]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);
    
    const isModalOpen = isAddTxModalOpen || isMintorModalOpen;
    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isModalOpen]);


    const setTheme = (newTheme: Theme) => {
        dbService.setTheme(newTheme);
        setThemeState(newTheme);
    };

    const addTransaction = async (tx: Omit<Transaction, 'id' | 'ts'>) => {
        const newTx = await dbService.addTransaction(tx);
        setTransactions(prev => [newTx, ...prev].sort((a, b) => b.ts - a.ts));
        recalculateGoals();
    };

    const updateTransaction = async (tx: Transaction) => {
        await dbService.updateTransaction(tx);
        setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
        recalculateGoals();
    };

    const deleteTransaction = async (id: string) => {
        await dbService.deleteTransaction(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        recalculateGoals();
    };

    const deleteTransactions = async (ids: string[]) => {
        await dbService.deleteTransactions(ids);
        setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
        recalculateGoals();
    };
    
    const addGoal = async (goal: Omit<Goal, 'id' | 'created_at' | 'current_amount' | 'completed_bool'>) => {
        const newGoal = await dbService.addGoal(goal);
        setGoals(prev => [newGoal, ...prev]);
    };

    const updateGoal = async (goal: Goal) => {
        await dbService.updateGoal(goal);
        recalculateGoals();
    };
    
    const deleteGoal = async (id: string) => {
        await dbService.deleteGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    const linkTransactionToGoal = async (txId: string, goalId: string | null) => {
        const tx = transactions.find(t => t.id === txId);
        if(!tx) return;
        const updatedTx = { ...tx, goal_id: goalId };
        await updateTransaction(updatedTx);
    };

    const handleEditTransaction = (tx: Transaction) => {
        setEditingTx(tx);
        setAddTxModalOpen(true);
    };
    
    const handleCloseAddTxModal = () => {
        setEditingTx(null);
        setAddTxModalOpen(false);
    };

    const renderScreen = () => {
        switch (screen) {
            case 'Home':
                return <HomeScreen onAddTransaction={() => setAddTxModalOpen(true)} onEditTransaction={handleEditTransaction} setScreen={setScreen} />;
            case 'Transactions':
                return <TransactionsScreen onEditTransaction={handleEditTransaction} />;
            case 'Insights':
                return <InsightsScreen />;
            case 'Goals':
                return <GoalsScreen />;
            case 'Settings':
                return <SettingsScreen />;
            default:
                return <HomeScreen onAddTransaction={() => setAddTxModalOpen(true)} onEditTransaction={handleEditTransaction} setScreen={setScreen} />;
        }
    };

    if (!isDataReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-on-background">Loading Sentimint...</div>
            </div>
        );
    }
    
    const appContextValue: AppContextType = {
        transactions,
        goals,
        theme,
        setTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        addGoal,
        updateGoal,
        deleteGoal,
        linkTransactionToGoal,
        formatCurrency
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className={`font-sans bg-background text-on-surface transition-colors duration-300`}>
                <div 
                    className="flex flex-col h-screen"
                    aria-hidden={isModalOpen}
                >
                    <TopAppBar onMintorClick={() => setMintorModalOpen(true)} />
                    <main className="flex-grow overflow-y-auto pb-20">
                        {renderScreen()}
                    </main>
                    <BottomNav activeScreen={screen} setScreen={setScreen} />
                </div>
                
                {isAddTxModalOpen && (
                    <AddTransactionModal 
                        isOpen={isAddTxModalOpen} 
                        onClose={handleCloseAddTxModal} 
                        transaction={editingTx}
                    />
                )}
                {isMintorModalOpen && (
                    <MintorAiModal 
                        isOpen={isMintorModalOpen} 
                        onClose={() => setMintorModalOpen(false)}
                        navigateTo={setScreen}
                    />
                )}
            </div>
        </AppContext.Provider>
    );
}