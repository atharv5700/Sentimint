import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import type { Screen, Theme, Transaction, Goal, Budget } from './types';
import { dbService } from './services/db';
import { hapticClick, hapticSuccess } from './services/haptics';
import HomeScreen from './components/screens/HomeScreen';
import TransactionsScreen from './components/screens/TransactionsScreen';
import InsightsScreen from './components/screens/InsightsScreen';
import GoalsScreen from './components/screens/GoalsScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import BottomNav from './components/layout/BottomNav';
import TopAppBar from './components/layout/TopAppBar';
import AddTransactionModal from './components/AddTransactionModal';
import MintorAiModal from './components/MintorAiModal';
import { PlusIcon } from './constants';

interface FabConfig {
    onClick: () => void;
    'aria-label': string;
}

interface AppContextType {
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'ts'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'current_amount' | 'completed_bool'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  linkTransactionToGoal: (txId: string, goalId: string | null) => Promise<void>;
  formatCurrency: (amount: number) => string;
  isBulkMode: boolean;
  setIsBulkMode: (isBulk: boolean) => void;
  setFabConfig: (config: FabConfig | null) => void;
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
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [theme, setThemeState] = useState<Theme>(dbService.getTheme());
    const [isDataReady, setIsDataReady] = useState(false);
    
    const [isAddTxModalOpen, setAddTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isMintorModalOpen, setMintorModalOpen] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [fabConfig, setFabConfig] = useState<FabConfig | null>(null);

    const isAModalOpen = useMemo(() => isAddTxModalOpen || isMintorModalOpen, [isAddTxModalOpen, isMintorModalOpen]);

    const recalculateGoals = useCallback(async () => {
        const allGoals = dbService.getGoals();
        const allTransactions = dbService.getTransactions();
        let goalsWereUpdated = false;

        if (!Array.isArray(allGoals)) return;

        for (const goal of allGoals) {
            const linkedTxs = allTransactions.filter(t => t.goal_id === goal.id);
            const newCurrentAmount = linkedTxs.reduce((sum, currentTx) => sum + currentTx.amount, 0);
            const newCompletedStatus = newCurrentAmount >= goal.target_amount;

            if (goal.current_amount !== newCurrentAmount || goal.completed_bool !== newCompletedStatus) {
                const updatedGoal = { ...goal, current_amount: newCurrentAmount, completed_bool: newCompletedStatus };
                await dbService.updateGoal(updatedGoal);
                goalsWereUpdated = true;
            }
        }
        
        if (goalsWereUpdated) {
            const updatedGoalsFromDb = dbService.getGoals();
            setGoals(updatedGoalsFromDb.sort((a, b) => a.completed_bool ? 1 : -1));
        } else {
             setGoals(allGoals.sort((a, b) => a.completed_bool ? 1 : -1));
        }
    }, []);

    const loadData = useCallback(async () => {
        await dbService.init();
        setTransactions(dbService.getTransactions());
        setBudgets(dbService.getBudgets());
        await recalculateGoals();
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
    
    useEffect(() => {
        document.body.style.overflow = isAModalOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isAModalOpen]);

    // System Back Button / Gesture handling for modals
    useEffect(() => {
        const handlePopState = () => {
            if (isAddTxModalOpen) setAddTxModalOpen(false);
            if (isMintorModalOpen) setMintorModalOpen(false);
        };
    
        if (isAModalOpen) {
            // Push a state only if one isn't already there. This prevents multiple history entries
            // if one modal opens another.
            if (!window.history.state?.modal) {
                window.history.pushState({ modal: true }, '');
            }
            window.addEventListener('popstate', handlePopState);
        }
    
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isAModalOpen, isAddTxModalOpen, isMintorModalOpen]);


    const setTheme = (newTheme: Theme) => {
        dbService.setTheme(newTheme);
        setThemeState(newTheme);
    };

    const addTransaction = async (tx: Omit<Transaction, 'id' | 'ts'>) => {
        const newTx = await dbService.addTransaction(tx);
        setTransactions(prev => [newTx, ...prev].sort((a, b) => b.ts - a.ts));
        await recalculateGoals();
        hapticSuccess();
    };

    const updateTransaction = async (tx: Transaction) => {
        await dbService.updateTransaction(tx);
        setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
        await recalculateGoals();
        hapticSuccess();
    };

    const deleteTransaction = async (id: string) => {
        await dbService.deleteTransaction(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        await recalculateGoals();
        hapticSuccess();
    };

    const deleteTransactions = async (ids: string[]) => {
        await dbService.deleteTransactions(ids);
        setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
        await recalculateGoals();
        hapticSuccess();
    };
    
    const addGoal = async (goal: Omit<Goal, 'id' | 'created_at' | 'current_amount' | 'completed_bool'>) => {
        const newGoal = await dbService.addGoal(goal);
        setGoals(prev => [newGoal, ...prev]);
        hapticSuccess();
    };

    const updateGoal = async (goal: Goal) => {
        await dbService.updateGoal(goal);
        setGoals(prev => {
            const updated = prev.map(g => g.id === goal.id ? goal : g);
            return updated.sort((a, b) => a.completed_bool ? 1 : -1);
        });
        hapticSuccess();
    };
    
    const deleteGoal = async (id: string) => {
        await dbService.deleteGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
        hapticSuccess();
    };

    const addBudget = async (budget: Omit<Budget, 'id' | 'created_at'>) => {
        const newBudget = await dbService.addBudget(budget);
        setBudgets(prev => [...prev, newBudget].sort((a,b) => a.category.localeCompare(b.category)));
        hapticSuccess();
    };

    const updateBudget = async (budget: Budget) => {
        await dbService.updateBudget(budget);
        setBudgets(prev => prev.map(b => b.id === budget.id ? budget : b));
        hapticSuccess();
    };
    
    const deleteBudget = async (id: string) => {
        await dbService.deleteBudget(id);
        setBudgets(prev => prev.filter(b => b.id !== id));
        hapticSuccess();
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

    const createModalCloser = (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
        // If the history state was pushed by a modal, go back to pop it.
        // This will trigger the popstate listener which then sets the state to false.
        if (window.history.state?.modal) {
            window.history.back();
        } else {
            // Otherwise, just set the state directly (e.g., if history API is not supported)
            setter(false);
        }
    };
    
    const handleCloseAddTxModal = () => {
        setEditingTx(null);
        createModalCloser(setAddTxModalOpen)();
    };
    
    const handleCloseMintorModal = createModalCloser(setMintorModalOpen);

    const handleSetScreen = (newScreen: Screen) => {
        setIsBulkMode(false); // Reset bulk mode on screen change.
        setScreen(newScreen);
    };

    const renderScreen = () => {
        switch (screen) {
            case 'Home':
                return <HomeScreen onEditTransaction={handleEditTransaction} setScreen={handleSetScreen} />;
            case 'Transactions':
                return <TransactionsScreen onEditTransaction={handleEditTransaction} />;
            case 'Insights':
                return <InsightsScreen />;
            case 'Goals':
                return <GoalsScreen />;
            case 'Settings':
                return <SettingsScreen />;
            default:
                return <HomeScreen onEditTransaction={handleEditTransaction} setScreen={handleSetScreen} />;
        }
    };

    const fabDetails = useMemo(() => {
        if (screen === 'Home' || screen === 'Transactions') {
            return {
                onClick: () => {
                    hapticClick();
                    setAddTxModalOpen(true);
                },
                'aria-label': 'Add Transaction',
                show: true,
            };
        }
        if (screen === 'Goals' && fabConfig) {
            return { ...fabConfig, show: true };
        }
        return { show: false, onClick: () => {}, 'aria-label': '' };
    }, [screen, fabConfig]);

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
        budgets,
        theme,
        setTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        addGoal,
        updateGoal,
        deleteGoal,
        addBudget,
        updateBudget,
        deleteBudget,
        linkTransactionToGoal,
        formatCurrency,
        isBulkMode,
        setIsBulkMode,
        setFabConfig,
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className={`font-sans bg-background text-on-surface transition-colors duration-300`}>
                <div 
                    className="flex flex-col h-screen"
                    aria-hidden={isAModalOpen}
                >
                    <TopAppBar onMintorClick={() => setMintorModalOpen(true)} />
                    <main className="flex-grow overflow-y-auto pb-24">
                        <div key={screen} className="animate-screenFadeIn">
                            {renderScreen()}
                        </div>
                    </main>
                    <BottomNav activeScreen={screen} setScreen={handleSetScreen} />
                </div>
                
                {fabDetails.show && !isAModalOpen && !isBulkMode && (
                     <button
                        onClick={fabDetails.onClick}
                        className="fixed bottom-24 right-6 bg-primary-container text-on-primary-container rounded-2xl shadow-lg w-14 h-14 flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-modalSlideUp z-10"
                        aria-label={fabDetails['aria-label']}
                    >
                        <PlusIcon className="w-7 h-7" />
                    </button>
                )}

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
                        onClose={handleCloseMintorModal}
                        navigateTo={handleSetScreen}
                    />
                )}
            </div>
        </AppContext.Provider>
    );
}