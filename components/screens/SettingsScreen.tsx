import React, { useState } from 'react';
import { useAppContext } from '../../App';
import type { Theme } from '../../types';
import { dbService } from '../../services/db';

const SegmentedButton: React.FC<{ options: {label: string, value: Theme}[], selected: Theme, onSelect: (value: Theme) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex justify-center p-1 bg-surface rounded-full">
        {options.map(({label, value}) => (
            <button
                key={value}
                onClick={() => onSelect(value)}
                className={`w-full capitalize px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    selected === value ? 'bg-secondary-container text-on-secondary-container shadow' : 'text-on-surface-variant'
                }`}
            >
                {label}
            </button>
        ))}
    </div>
);


export default function SettingsScreen() {
    const { theme, setTheme } = useAppContext();
    const [deleteConfirm, setDeleteConfirm] = useState('');

    const handleExport = () => {
        try {
            const csv = dbService.exportToCsv();
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'sentimint_export.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch(e) {
            console.error("Failed to export data", e);
            alert("Error exporting data. Please try again.");
        }
    };

    const handleDeleteAll = () => {
        if (deleteConfirm === 'DELETE') {
            dbService.deleteAllData().then(() => {
                alert('All data deleted. The app will now reload.');
                window.location.reload();
            });
        } else {
            alert('Please type "DELETE" to confirm.');
        }
    };
    
    return (
        <div className="p-4 space-y-6">
            <div className="bg-surface-variant p-4 rounded-3xl">
                <h2 className="text-title-m font-medium mb-4 text-on-surface-variant">Appearance</h2>
                <SegmentedButton 
                    options={[{label: 'Light', value: 'light'}, {label: 'Dark', value: 'dark'}]}
                    selected={theme}
                    onSelect={setTheme}
                />
            </div>
            
            <div className="bg-surface-variant p-4 rounded-3xl">
                 <h2 className="text-title-m font-medium mb-4 text-on-surface-variant">Data Management</h2>
                 <div className="flex flex-col gap-2">
                     <button onClick={handleExport} className="w-full text-left p-3 rounded-lg bg-surface text-on-surface hover:bg-surface/80">Export Data to CSV</button>
                 </div>
                 <div className="mt-4 border-t border-outline pt-4">
                     <input 
                         type="text" 
                         placeholder='Type "DELETE" to confirm'
                         value={deleteConfirm}
                         onChange={(e) => setDeleteConfirm(e.target.value)}
                         className="w-full bg-surface p-3 rounded-lg mb-2 text-on-surface"
                     />
                     <button onClick={handleDeleteAll} className="w-full p-3 rounded-lg bg-error-container text-on-error-container">Delete All Data</button>
                 </div>
            </div>
            
            <div className="bg-surface-variant p-4 rounded-3xl text-on-surface-variant">
                <h2 className="text-title-m font-medium mb-2">About Sentimint</h2>
                <p className="text-body-m mb-2">Our mission is to help you build a healthier relationship with your finances by understanding the emotions behind your spending.</p>
                <p className="text-body-m">Your privacy is paramount. Mintor AI and all data processing run entirely on-device; your data never leaves your phone.</p>
            </div>

            <div className="text-center text-on-surface-variant text-sm">
                <p className="font-medium">Sentimint v1.2</p>
                <p>Created by - deshpandeatharv5700@gmail.com</p>
            </div>
        </div>
    );
}