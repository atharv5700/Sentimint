import React, { useState } from 'react';
import { useAppContext } from '../../App';
import type { Theme, Screen } from '../../types';
import { dbService } from '../../services/db';
import { hapticClick, hapticSuccess, hapticError } from '../../services/haptics';

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

export const ExportDataModal: React.FC<{ csvData: string; onClose: () => void }> = ({ csvData, onClose }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        hapticClick();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(csvData).then(() => {
                hapticSuccess();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }, (err) => {
                hapticError();
                console.error('Could not copy text: ', err);
                alert('Failed to copy data. Please try again.');
            });
        } else {
            // Fallback for older WebViews without clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = csvData;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                hapticSuccess();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                hapticError();
                alert('Failed to copy data. Please select all and copy manually.');
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm animate-modalSlideUp">
                <h2 className="text-headline-m mb-4">Export Data</h2>
                <p className="text-body-m text-on-surface-variant mb-2">
                    Your data is ready to be exported. Copy the text below and save it as a `.csv` file.
                </p>
                <textarea
                    readOnly
                    value={csvData}
                    className="w-full h-40 bg-surface-variant text-on-surface-variant rounded-lg p-2 text-xs font-mono"
                />
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { hapticClick(); onClose(); }} className="px-4 py-2 rounded-full text-primary">Close</button>
                    <button onClick={handleCopy} className="px-6 py-2 rounded-full bg-primary text-on-primary">
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteDataModal: React.FC<{ onConfirm: () => void; onClose: () => void }> = ({ onConfirm, onClose }) => {
    const [confirmText, setConfirmText] = useState('');
    const isConfirmed = confirmText === 'DELETE';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm animate-modalSlideUp">
                <h2 className="text-headline-m mb-2 text-error">Are you sure?</h2>
                <p className="text-body-m text-on-surface-variant mb-4">
                    This will permanently delete all your data, including transactions, goals, and budgets. This action cannot be undone.
                </p>
                <p className="text-body-m text-on-surface-variant mb-4">
                    To confirm, please type <strong>DELETE</strong> in the box below.
                </p>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-error"
                />
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { hapticClick(); onClose(); }} className="px-4 py-2 rounded-full text-primary">Cancel</button>
                    <button 
                        onClick={() => { hapticClick(); onConfirm(); }} 
                        disabled={!isConfirmed}
                        className="px-6 py-2 rounded-full bg-error text-on-error disabled:bg-outline disabled:text-on-surface-variant"
                    >
                        Delete Data
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SettingsScreenProps {
    setScreen: (screen: Screen) => void;
}

export default function SettingsScreen({ setScreen }: SettingsScreenProps) {
    const { theme, setTheme } = useAppContext();
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [csvData, setCsvData] = useState('');

    const handleExport = () => {
        hapticClick();
        try {
            const csv = dbService.exportToCsv();
            setCsvData(csv);
            setShowExportModal(true);
        } catch(e) {
            console.error("Failed to prepare export data", e);
            alert("Error preparing data for export. Please try again.");
        }
    };
    
    const handleDeleteData = () => {
        dbService.deleteAllData();
        // The app will reload automatically from the db service.
    };

    return (
        <div className="p-4 space-y-6 stagger-children">
            <div className="bg-surface-variant p-4 rounded-3xl" style={{'--stagger-delay': 1} as React.CSSProperties}>
                <h2 className="text-title-m font-medium mb-4 text-on-surface-variant">Appearance</h2>
                <SegmentedButton 
                    options={[{label: 'Light', value: 'light'}, {label: 'Dark', value: 'dark'}]}
                    selected={theme}
                    onSelect={setTheme}
                />
            </div>
            
             <div className="bg-surface-variant p-4 rounded-3xl" style={{'--stagger-delay': 2} as React.CSSProperties}>
                 <h2 className="text-title-m font-medium mb-4 text-on-surface-variant">Personalization</h2>
                 <div className="flex flex-col gap-2">
                     <button onClick={() => setScreen('ManageCategories')} className="w-full text-left p-3 rounded-xl bg-surface text-on-surface hover:bg-surface/80 transition-colors">Manage Categories</button>
                 </div>
            </div>

            <div className="bg-surface-variant p-4 rounded-3xl" style={{'--stagger-delay': 3} as React.CSSProperties}>
                 <h2 className="text-title-m font-medium mb-4 text-on-surface-variant">Data Management</h2>
                 <div className="flex flex-col gap-2">
                     <button onClick={handleExport} className="w-full text-left p-3 rounded-xl bg-surface text-on-surface hover:bg-surface/80 transition-colors">Export Data to CSV</button>
                     <button onClick={() => setScreen('Import')} className="w-full text-left p-3 rounded-xl bg-surface text-on-surface hover:bg-surface/80 transition-colors">Import Data from CSV</button>
                     <button onClick={() => { hapticError(); setShowDeleteModal(true); }} className="w-full text-left p-3 rounded-xl bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors font-medium">Delete All Data</button>
                 </div>
            </div>
            
            <div className="bg-surface-variant p-4 rounded-3xl text-on-surface-variant" style={{'--stagger-delay': 4} as React.CSSProperties}>
                <h2 className="text-title-m font-medium mb-2">About Sentimint</h2>
                <p className="text-body-m mb-4">Our mission is to help you build a healthier relationship with your finances by understanding the emotions behind your spending.</p>
                <h3 className="text-title-s font-medium mb-1 text-on-surface-variant/90">Privacy Commitment</h3>
                <p className="text-body-m">Your privacy is paramount. Mintor AI and all data processing run entirely on-device; your data never leaves your phone.</p>
            </div>
            
            <div className="bg-surface-variant p-4 rounded-3xl text-on-surface-variant" style={{'--stagger-delay': 5} as React.CSSProperties}>
                 <h2 className="text-title-m font-medium mb-3">App Information</h2>
                 <div className="space-y-2 text-body-m">
                    <div className="flex justify-between">
                        <span className="text-on-surface-variant/80">Version</span>
                        <span className="font-medium text-on-surface-variant">2.3.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-on-surface-variant/80">Developer</span>
                        <span className="font-medium text-on-surface-variant">Atharv Mahesh Deshpande</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-on-surface-variant/80">Contact</span>
                        <a href="mailto:deshpandeatharv5700@gmail.com" className="font-medium text-primary">deshpandeatharv5700@gmail.com</a>
                    </div>
                 </div>
            </div>

            {showExportModal && <ExportDataModal csvData={csvData} onClose={() => setShowExportModal(false)} />}
            {showDeleteModal && <DeleteDataModal onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteData} />}
        </div>
    );
}