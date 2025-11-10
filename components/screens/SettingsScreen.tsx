import React, { useState } from 'react';
import { useAppContext } from '../../App';
import type { Theme, Screen } from '../../types';
import { hapticClick, hapticSuccess, hapticError } from '../../services/haptics';
import { CloseIcon } from '../../constants';

const SegmentedButton: React.FC<{ options: {label: string, value: Theme}[], selected: Theme, onSelect: (value: Theme) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex justify-center p-1 bg-surface rounded-full">
        {options.map(({label, value}) => (
            <button
                key={value}
                onClick={() => { hapticClick(); onSelect(value); }}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0 animate-backdropFadeIn" onClick={onClose}>
            <div className="bg-surface rounded-t-[28px] p-2 sm:p-4 w-full max-w-2xl flex flex-col max-h-[90vh] animate-modalSlideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2 flex-shrink-0">
                    <div className="w-8 h-1 bg-outline rounded-full"></div>
                </div>
                <div className="flex justify-between items-center mb-4 flex-shrink-0 px-2 sm:px-0">
                    <h2 className="text-headline-m">Export Data</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="text-on-surface-variant p-2" aria-label="Close export modal">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="overflow-y-auto px-2 sm:px-0 pb-4 space-y-4">
                     <p className="text-body-m text-on-surface-variant">
                        Your data is ready to be exported. Copy the text below and save it as a `.csv` file to use in other applications like Excel or Google Sheets.
                    </p>
                    <textarea
                        readOnly
                        value={csvData}
                        className="w-full h-48 bg-surface-variant text-on-surface-variant rounded-lg p-2 text-xs font-mono focus:outline-none"
                    />
                </div>
                
                <div className="pt-4 border-t border-outline-variant flex-shrink-0 px-2 sm:px-0 pb-safe">
                     <button onClick={handleCopy} className="w-full py-4 rounded-full bg-primary text-on-primary font-bold">
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
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
    const { theme, setTheme, openImportModal, openExportModal } = useAppContext();
    
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

            <div className="bg-surface-variant p-4 rounded-3xl" style={{'--stagger-delay': 3} as React.CSSProperties}>
                 <h2 className="text-title-m font-medium mb-4 text-on-surface-variant">Data Management</h2>
                 <div className="flex flex-col gap-2">
                     <button onClick={openExportModal} className="w-full text-left p-3 rounded-xl bg-surface text-on-surface hover:bg-surface/80 transition-colors">Export Data to CSV</button>
                     <button onClick={() => { hapticClick(); openImportModal(); }} className="w-full text-left p-3 rounded-xl bg-surface text-on-surface hover:bg-surface/80 transition-colors">Import Data from CSV</button>
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
                        <span className="font-medium text-on-surface-variant">2.4.0</span>
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
        </div>
    );
}