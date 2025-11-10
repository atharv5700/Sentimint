import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import type { Screen, Theme, Transaction, Budget, RecurringTransaction, UserChallenge, Challenge } from './types';
import { dbService } from './services/db';
import { ALL_CHALLENGES } from './data/challenges';
import { hapticClick, hapticSuccess, hapticError } from './services/haptics';
import HomeScreen from './components/screens/HomeScreen';
import TransactionsScreen from './components/screens/TransactionsScreen';
import InsightsScreen from './components/screens/InsightsScreen';
import GoalsScreen, { BudgetModal } from './components/screens/GoalsScreen';
import SettingsScreen, { ExportDataModal } from './components/screens/SettingsScreen';
import ImportDataModal from './components/screens/ImportScreen';
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
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  customCategories: string[];
  userChallenges: UserChallenge[];
  streak: number;
  theme: Theme;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: Theme) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'ts'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurringTransaction: (rTx: Omit<RecurringTransaction, 'id' | 'last_added_date'>) => Promise<void>;
  updateRecurringTransaction: (rTx: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  addCustomCategory: (category: string) => Promise<void>;
  deleteCustomCategory: (category: string) => Promise<void>;
  startChallenge: (challengeId: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  isBulkMode: boolean;
  setIsBulkMode: (isBulk: boolean) => void;
  setFabConfig: (config: FabConfig | null) => void;
  openTransactionModal: (tx?: Transaction | null) => void;
  openBudgetModal: (budget?: Budget | null) => void;
  openRecurringTransactionModal: (rTx?: RecurringTransaction | null) => void;
  openImportModal: () => void;
  openExportModal: () => void;
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
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
    const [streak, setStreak] = useState(0);
    const [theme, setThemeState] = useState<Theme>(dbService.getTheme());
    const [isDataReady, setIsDataReady] = useState(false);
    
    const [isAddTxModalOpen, setAddTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isMintorModalOpen, setMintorModalOpen] = useState(false);
    const [isSearchModalOpen, setSearchModalOpen] = useState(false);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [isRecurringTxModalOpen, setRecurringTxModalOpen] = useState(false);
    const [editingRecurringTx, setEditingRecurringTx] = useState<RecurringTransaction | null>(null);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [csvData, setCsvData] = useState('');

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [fabConfig, setFabConfig] = useState<FabConfig | null>(null);

    const isAModalOpen = useMemo(() => isAddTxModalOpen || isMintorModalOpen || isBudgetModalOpen || isRecurringTxModalOpen || isSearchModalOpen || isImportModalOpen || isExportModalOpen, [isAddTxModalOpen, isMintorModalOpen, isBudgetModalOpen, isRecurringTxModalOpen, isSearchModalOpen, isImportModalOpen, isExportModalOpen]);

    const processChallenges = useCallback(async (txs: Transaction[]) => {
        const challenges = dbService.getUserChallenges();
        const activeChallenges = challenges.filter(c => c.status === 'active');
        if (activeChallenges.length === 0) return;

        let challengesUpdated = false;
        for (const userChallenge of activeChallenges) {
            const challengeDef = ALL_CHALLENGES.find(c => c.id === userChallenge.challengeId);
            if (!challengeDef) continue;

            const challengeEndDate = userChallenge.startDate + challengeDef.durationDays * 24 * 60 * 60 * 1000;
            if (Date.now() > challengeEndDate) {
                if (userChallenge.progress >= challengeDef.targetValue) {
                    userChallenge.status = 'completed';
                } else {
                    userChallenge.status = 'failed';
                }
                userChallenge.endDate = Date.now();
                challengesUpdated = true;
                continue;
            }
            
            const relevantTxs = txs.filter(tx => tx.ts >= userChallenge.startDate && tx.ts <= challengeEndDate);

            if (challengeDef.type === 'saveAmount') {
                // This challenge type is now inert as goal_id is removed.
                // It will just stay at 0 progress until it fails.
                // Could be updated to track positive-mood transactions later.
            } else if (challengeDef.type === 'spendLimitOnCategory') {
                const categories = challengeDef.category?.split(';') || [];
                const newProgress = relevantTxs
                    .filter(tx => categories.includes(tx.category))
                    .reduce((sum, tx) => sum + tx.amount, 0);
                if (newProgress !== userChallenge.progress) {
                    userChallenge.progress = newProgress;
                    if (newProgress > challengeDef.targetValue) {
                        userChallenge.status = 'failed';
                        userChallenge.endDate = Date.now();
                    }
                    challengesUpdated = true;
                }
            } else if (challengeDef.type === 'noSpendOnCategory') {
                const categories = challengeDef.category?.split(';') || [];
                const hasSpent = relevantTxs.some(tx => categories.includes(tx.category));
                 if (hasSpent) {
                    userChallenge.status = 'failed';
                    userChallenge.endDate = Date.now();
                    challengesUpdated = true;
                 }
            }
        }

        if (challengesUpdated) {
            await dbService.saveUserChallenges(challenges);
            setUserChallenges(challenges);
        }
    }, []);

    const refreshData = useCallback(async () => {
        const freshTxs = dbService.getTransactions();
        setTransactions(freshTxs);
        setBudgets(dbService.getBudgets());
        setRecurringTransactions(dbService.getRecurringTransactions());
        setCustomCategories(dbService.getCustomCategories());
        const streakData = dbService.getStreakData();
        setStreak(streakData.currentStreak);
        const challenges = dbService.getUserChallenges();
        setUserChallenges(challenges);
        await processChallenges(freshTxs);
    }, [processChallenges]);

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
            if (isBudgetModalOpen) setBudgetModalOpen(false);
            if (isRecurringTxModalOpen) setRecurringTxModalOpen(false);
            if (isImportModalOpen) setImportModalOpen(false);
            if (isExportModalOpen) setExportModalOpen(false);
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
    }, [isAModalOpen, isAddTxModalOpen, isMintorModalOpen, isSearchModalOpen, isBudgetModalOpen, isRecurringTxModalOpen, isImportModalOpen, isExportModalOpen]);


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

    const startChallenge = async (challengeId: string) => {
        const challenges = dbService.getUserChallenges();
        const newChallenge: UserChallenge = {
            challengeId,
            startDate: Date.now(),
            status: 'active',
            progress: 0,
        };
        challenges.push(newChallenge);
        await dbService.saveUserChallenges(challenges);
        await refreshData();
        hapticSuccess();
    };

    const openTransactionModal = useCallback((tx: Transaction | null = null) => {
        setEditingTx(tx);
        setAddTxModalOpen(true);
    }, []);

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
    
    const handleCloseBudgetModal = () => {
        setEditingBudget(null);
        createModalCloser(setBudgetModalOpen)();
    };
    
    const handleCloseRecurringTxModal = () => {
        setEditingRecurringTx(null);
        createModalCloser(setRecurringTxModalOpen)();
    };
    
    const handleCloseImportModal = createModalCloser(setImportModalOpen);
    const handleCloseExportModal = createModalCloser(setExportModalOpen);

    const openBudgetModal = (budget: Budget | null = null) => {
        setEditingBudget(budget);
        setBudgetModalOpen(true);
    };

    const openRecurringTransactionModal = (rTx: RecurringTransaction | null = null) => {
        setEditingRecurringTx(rTx);
        setRecurringTxModalOpen(true);
    };

    const openImportModal = () => {
        setImportModalOpen(true);
    };

    const openExportModal = () => {
        try {
            const csv = dbService.exportToCsv();
            setCsvData(csv);
            setExportModalOpen(true);
            hapticClick();
        } catch(e) {
            console.error("Failed to prepare export data", e);
            alert("Error preparing data for export. Please try again.");
            hapticError();
        }
    };

    const handleSetScreen = (newScreen: Screen) => {
        setIsBulkMode(false); // Reset bulk mode on screen change.
        setScreen(newScreen);
    };

    const renderScreen = () => {
        switch (screen) {
            case 'Home':
                return <HomeScreen onEditTransaction={openTransactionModal} setScreen={handleSetScreen} />;
            case 'Ledger':
                return <TransactionsScreen onEditTransaction={openTransactionModal} />;
            case 'Insights':
                return <InsightsScreen />;
            case 'Budgets':
                return <GoalsScreen />;
            case 'Settings':
                return <SettingsScreen setScreen={handleSetScreen} />;
            default:
                return <HomeScreen onEditTransaction={openTransactionModal} setScreen={handleSetScreen} />;
        }
    };

    const fabDetails = useMemo(() => {
        if (screen === 'Home' || screen === 'Ledger') {
            return {
                onClick: () => {
                    hapticClick();
                    openTransactionModal(null);
                },
                'aria-label': 'Add Transaction',
                show: true,
            };
        }
        if (screen === 'Budgets' && fabConfig) {
            return { ...fabConfig, show: true };
        }
        return { show: false, onClick: () => {}, 'aria-label': '' };
    }, [screen, fabConfig, openTransactionModal]);

    if (!isDataReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-on-background">Loading Sentimint...</div>
            </div>
        );
    }
    
    const appContextValue: AppContextType = {
        transactions,
        budgets,
        recurringTransactions,
        customCategories,
        userChallenges,
        streak,
        theme,
        setScreen: handleSetScreen,
        setTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        addBudget,
        updateBudget,
        deleteBudget,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        addCustomCategory,
        deleteCustomCategory,
        startChallenge,
        formatCurrency,
        isBulkMode,
        setIsBulkMode,
        setFabConfig,
        openTransactionModal,
        openBudgetModal,
        openRecurringTransactionModal,
        openImportModal,
        openExportModal,
        refreshData,
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className={`font-sans bg-background text-on-surface transition-colors duration-300`}>
                <div 
                    className="h-screen relative"
                    aria-hidden={isAModalOpen}
                >
                    <TopAppBar 
                        onMintorClick={() => setMintorModalOpen(true)} 
                        onSearchClick={() => setSearchModalOpen(true)}
                    />
                    <main className="absolute inset-0 overflow-y-auto">
                        <div key={screen} className="animate-screenFadeIn pt-[76px] pb-24">
                            {renderScreen()}
                        </div>
                    </main>
                    <BottomNav activeScreen={screen} setScreen={handleSetScreen} isBulkMode={isBulkMode} />
                </div>
                
                {fabDetails.show && !isAModalOpen && !isBulkMode && (
                     <button
                        onClick={fabDetails.onClick}
                        className="fixed bottom-24 right-6 bg-primary-container/95 dark:bg-primary-container/90 backdrop-blur-sm border border-primary/20 text-on-primary-container rounded-2xl shadow-lg w-[3.75rem] h-[3.75rem] flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fabPopIn z-10"
                        aria-label={fabDetails['aria-label']}
                    >
                        <PlusIcon className="w-8 h-8" />
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
                {isImportModalOpen && (
                    <ImportDataModal
                        isOpen={isImportModalOpen}
                        onClose={handleCloseImportModal}
                    />
                )}
                 {isExportModalOpen && (
                    <ExportDataModal
                        csvData={csvData}
                        onClose={handleCloseExportModal}
                    />
                )}
            </div>
        </AppContext.Provider>
    );
}