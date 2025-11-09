import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import type { Screen, Theme, Transaction, Goal, Budget, RecurringTransaction } from './types';
import { dbService } from './services/db';
import { hapticClick, hapticSuccess } from './services/haptics';
import HomeScreen from './components/screens/HomeScreen';
import TransactionsScreen from './components/screens/TransactionsScreen';
import InsightsScreen from './components/screens/InsightsScreen';
import GoalsScreen, { GoalModal, BudgetModal } from './components/screens/GoalsScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import ImportScreen from './components/screens/ImportScreen';
import ManageCategoriesScreen from './components/screens/ManageCategoriesScreen';
import BottomNav from './components/layout/BottomNav';
import TopAppBar from './components/layout/TopAppBar';
import AddTransactionModal from './components/AddTransactionModal';
import MintorAiModal from './components/MintorAiModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import { PlusIcon } from './constants';
import RecurringTransactionModal from './components/RecurringTransactionModal';

interface FabConfig {
    onClick: () => void;
    'aria-label': string;
}

export interface AppContextType {
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  customCategories: string[];
  theme: Theme;
  setScreen: (screen: Screen) => void;
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
  addRecurringTransaction: (rTx: Omit<RecurringTransaction, 'id' | 'last_added_date'>) => Promise<void>;
  updateRecurringTransaction: (rTx: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  addCustomCategory: (category: string) => Promise<void>;
  deleteCustomCategory: (category: string) => Promise<void>;
  linkTransactionToGoal: (txId: string, goalId: string | null) => Promise<void>;
  formatCurrency: (amount: number) => string;
  isBulkMode: boolean;
  setIsBulkMode: (isBulk: boolean) => void;
  setFabConfig: (config: FabConfig | null) => void;
  openTransactionModal: (tx?: Transaction | null) => void;
  openGoalModal: (goal?: Goal | null) => void;
  openBudgetModal: (budget?: Budget | null) => void;
  openRecurringTransactionModal: (rTx?: RecurringTransaction | null) => void;
  refreshData: () => Promise<void>;
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
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [theme, setThemeState] = useState<Theme>(dbService.getTheme());
    const [isDataReady, setIsDataReady] = useState(false);
    
    const [isAddTxModalOpen, setAddTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isMintorModalOpen, setMintorModalOpen] = useState(false);
    const [isSearchModalOpen, setSearchModalOpen] = useState(false);
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [isRecurringTxModalOpen, setRecurringTxModalOpen] = useState(false);
    const [editingRecurringTx, setEditingRecurringTx] = useState<RecurringTransaction | null>(null);

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [fabConfig, setFabConfig] = useState<FabConfig | null>(null);

    const isAModalOpen = useMemo(() => isAddTxModalOpen || isMintorModalOpen || isGoalModalOpen || isBudgetModalOpen || isRecurringTxModalOpen || isSearchModalOpen, [isAddTxModalOpen, isMintorModalOpen, isGoalModalOpen, isBudgetModalOpen, isRecurringTxModalOpen, isSearchModalOpen]);

    const recalculateGoals = useCallback(async (txs: Transaction[]) => {
        const allGoals = dbService.getGoals();
        let goalsWereUpdated = false;

        if (!Array.isArray(allGoals)) return;

        for (const goal of allGoals) {
            const linkedTxs = txs.filter(t => t.goal_id === goal.id);
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

    const refreshData = useCallback(async () => {
        const freshTxs = dbService.getTransactions();
        setTransactions(freshTxs);
        setBudgets(dbService.getBudgets());
        setRecurringTransactions(dbService.getRecurringTransactions());
        setCustomCategories(dbService.getCustomCategories());
        await recalculateGoals(freshTxs);
    }, [recalculateGoals]);

    const loadData = useCallback(async () => {
        await dbService.init();
        const recurringProcessed = await dbService.processRecurringTransactions();
        if (recurringProcessed) {
            console.log('Recurring transactions were processed.');
        }
        await refreshData();
        setIsDataReady(true);
    }, [refreshData]);

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
            if (isSearchModalOpen) setSearchModalOpen(false);
            if (isGoalModalOpen) setGoalModalOpen(false);
            if (isBudgetModalOpen) setBudgetModalOpen(false);
            if (isRecurringTxModalOpen) setRecurringTxModalOpen(false);
        };
    
        if (isAModalOpen) {
            if (!window.history.state?.modal) {
                window.history.pushState({ modal: true }, '');
            }
            window.addEventListener('popstate', handlePopState);
        }
    
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isAModalOpen, isAddTxModalOpen, isMintorModalOpen, isSearchModalOpen, isGoalModalOpen, isBudgetModalOpen, isRecurringTxModalOpen]);


    const setTheme = (newTheme: Theme) => {
        dbService.setTheme(newTheme);
        setThemeState(newTheme);
    };

    const addTransaction = async (tx: Omit<Transaction, 'id' | 'ts'>) => {
        await dbService.addTransaction(tx);
        await refreshData();
        hapticSuccess();
    };

    const updateTransaction = async (tx: Transaction) => {
        await dbService.updateTransaction(tx);
        await refreshData();
        hapticSuccess();
    };

    const deleteTransaction = async (id: string) => {
        await dbService.deleteTransaction(id);
        await refreshData();
        hapticSuccess();
    };

    const deleteTransactions = async (ids: string[]) => {
        await dbService.deleteTransactions(ids);
        await refreshData();
        hapticSuccess();
    };
    
    const addGoal = async (goal: Omit<Goal, 'id' | 'created_at' | 'current_amount' | 'completed_bool'>) => {
        await dbService.addGoal(goal);
        await refreshData();
        hapticSuccess();
    };

    const updateGoal = async (goal: Goal) => {
        await dbService.updateGoal(goal);
        await refreshData();
        hapticSuccess();
    };
    
    const deleteGoal = async (id: string) => {
        await dbService.deleteGoal(id);
        await refreshData();
        hapticSuccess();
    };

    const addBudget = async (budget: Omit<Budget, 'id' | 'created_at'>) => {
        await dbService.addBudget(budget);
        await refreshData();
        hapticSuccess();
    };

    const updateBudget = async (budget: Budget) => {
        await dbService.updateBudget(budget);
        await refreshData();
        hapticSuccess();
    };
    
    const deleteBudget = async (id: string) => {
        await dbService.deleteBudget(id);
        await refreshData();
        hapticSuccess();
    };

    const addRecurringTransaction = async (rTx: Omit<RecurringTransaction, 'id' | 'last_added_date'>) => {
        await dbService.addRecurringTransaction(rTx);
        await refreshData();
        hapticSuccess();
    };
    
    const updateRecurringTransaction = async (rTx: RecurringTransaction) => {
        await dbService.updateRecurringTransaction(rTx);
        await refreshData();
        hapticSuccess();
    };
    
    const deleteRecurringTransaction = async (id: string) => {
        await dbService.deleteRecurringTransaction(id);
        await refreshData();
        hapticSuccess();
    };

    const addCustomCategory = async (category: string) => {
        await dbService.addCustomCategory(category);
        await refreshData();
        hapticSuccess();
    };

    const deleteCustomCategory = async (category: string) => {
        await dbService.deleteCustomCategory(category);
        await refreshData();
        hapticSuccess();
    };

    const linkTransactionToGoal = async (txId: string, goalId: string | null) => {
        const tx = transactions.find(t => t.id === txId);
        if(!tx) return;
        const updatedTx = { ...tx, goal_id: goalId };
        await updateTransaction(updatedTx);
    };

    const openTransactionModal = (tx: Transaction | null = null) => {
        setEditingTx(tx);
        setAddTxModalOpen(true);
    };

    const createModalCloser = (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
        if (window.history.state?.modal) {
            window.history.back();
        } else {
            setter(false);
        }
    };
    
    const handleCloseAddTxModal = () => {
        setEditingTx(null);
        createModalCloser(setAddTxModalOpen)();
    };
    
    const handleCloseMintorModal = createModalCloser(setMintorModalOpen);
    const handleCloseSearchModal = createModalCloser(setSearchModalOpen);

    const handleCloseGoalModal = () => {
        setEditingGoal(null);
        createModalCloser(setGoalModalOpen)();
    };
    
    const handleCloseBudgetModal = () => {
        setEditingBudget(null);
        createModalCloser(setBudgetModalOpen)();
    };
    
    const handleCloseRecurringTxModal = () => {
        setEditingRecurringTx(null);
        createModalCloser(setRecurringTxModalOpen)();
    };
    
    const openGoalModal = (goal: Goal | null = null) => {
        setEditingGoal(goal);
        setGoalModalOpen(true);
    };

    const openBudgetModal = (budget: Budget | null = null) => {
        setEditingBudget(budget);
        setBudgetModalOpen(true);
    };

    const openRecurringTransactionModal = (rTx: RecurringTransaction | null = null) => {
        setEditingRecurringTx(rTx);
        setRecurringTxModalOpen(true);
    };

    const handleSetScreen = (newScreen: Screen) => {
        setIsBulkMode(false); // Reset bulk mode on screen change.
        setScreen(newScreen);
    };

    const renderScreen = () => {
        switch (screen) {
            case 'Home':
                return <HomeScreen onEditTransaction={openTransactionModal} setScreen={handleSetScreen} />;
            case 'Transactions':
                return <TransactionsScreen onEditTransaction={openTransactionModal} />;
            case 'Insights':
                return <InsightsScreen />;
            case 'Goals':
                return <GoalsScreen />;
            case 'Settings':
                return <SettingsScreen setScreen={handleSetScreen} />;
            case 'Import':
                return <ImportScreen setScreen={handleSetScreen} />;
            case 'ManageCategories':
                return <ManageCategoriesScreen setScreen={handleSetScreen} />;
            default:
                return <HomeScreen onEditTransaction={openTransactionModal} setScreen={handleSetScreen} />;
        }
    };

    const fabDetails = useMemo(() => {
        if (screen === 'Home') {
            return {
                onClick: () => {
                    hapticClick();
                    openTransactionModal(null);
                },
                'aria-label': 'Add Transaction',
                show: true,
            };
        }
        if ((screen === 'Goals' || screen === 'Transactions') && fabConfig) {
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
        recurringTransactions,
        customCategories,
        theme,
        setScreen: handleSetScreen,
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
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        addCustomCategory,
        deleteCustomCategory,
        linkTransactionToGoal,
        formatCurrency,
        isBulkMode,
        setIsBulkMode,
        setFabConfig,
        openTransactionModal,
        openGoalModal,
        openBudgetModal,
        openRecurringTransactionModal,
        refreshData,
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className={`font-sans bg-background text-on-surface transition-colors duration-300`}>
                <div 
                    className="flex flex-col h-screen"
                    aria-hidden={isAModalOpen}
                >
                    <TopAppBar 
                        onMintorClick={() => setMintorModalOpen(true)} 
                        onSearchClick={() => setSearchModalOpen(true)}
                    />
                    <main className="flex-grow overflow-y-auto pb-24">
                        <div key={screen} className="animate-screenFadeIn">
                            {renderScreen()}
                        </div>
                    </main>
                    {screen !== 'Import' && screen !== 'ManageCategories' && <BottomNav activeScreen={screen} setScreen={handleSetScreen} />}
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
                        activeScreen={screen}
                    />
                )}
                {isSearchModalOpen && (
                    <GlobalSearchModal 
                        isOpen={isSearchModalOpen}
                        onClose={handleCloseSearchModal}
                    />
                )}
                 {isGoalModalOpen && (
                    <GoalModal 
                        onClose={handleCloseGoalModal} 
                        goalToEdit={editingGoal}
                    />
                )}
                {isBudgetModalOpen && (
                    <BudgetModal 
                        onClose={handleCloseBudgetModal} 
                        budgetToEdit={editingBudget}
                    />
                )}
                {isRecurringTxModalOpen && (
                    <RecurringTransactionModal
                        isOpen={isRecurringTxModalOpen}
                        onClose={handleCloseRecurringTxModal}
                        rTxToEdit={editingRecurringTx}
                    />
                )}
            </div>
        </AppContext.Provider>
    );
}