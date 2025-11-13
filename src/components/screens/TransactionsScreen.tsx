import React, { useMemo } from 'react';
import type { Transaction } from '../../types';
import { useAppContext } from '../../App';
import TransactionList from '../TransactionList';
import { hapticClick } from 'services/haptics';
import { EmptyState } from '../EmptyState';

export default function TransactionsScreen({ onEditTransaction }: { onEditTransaction: (tx: Transaction) => void }) {
    const { transactions, setIsBulkMode, openTransactionModal } = useAppContext();

    const sortedTransactions = useMemo(() => {
        // Default sort: newest first
        return [...transactions].sort((a, b) => b.ts - a.ts);
    }, [transactions]);

    return (
        <div className="px-4">
            {sortedTransactions.length > 0 ? (
                <TransactionList 
                    transactions={sortedTransactions} 
                    onEditTransaction={onEditTransaction}
                    isBulkSelectEnabled={true}
                    onBulkModeChange={setIsBulkMode}
                />
            ) : (
                <EmptyState
                    icon="box"
                    title="No Transactions"
                    message="You haven't added any transactions yet. Tap the '+' to get started."
                    action={{
                        label: "Add Transaction",
                        onClick: () => {
                            hapticClick();
                            openTransactionModal(null);
                        }
                    }}
                />
            )}
        </div>
    );
}