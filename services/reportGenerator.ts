import type { Transaction, Period, Theme } from '../types';
import { MOOD_MAP } from '../constants';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const getPeriodString = (period: Period): string => {
    switch (period) {
        case 'D': return 'Daily';
        case 'W': return 'Weekly';
        case 'M': return 'Monthly';
        case 'Y': return 'Yearly';
        default: return '';
    }
};

const generateCSS = (theme: Theme) => {
    const light = `
        --color-primary: 0 107 88;
        --color-on-primary: 255 255 255;
        --color-background: 253 251 255;
        --color-on-background: 27 27 31;
        --color-surface: 253 251 255;
        --color-on-surface: 27 27 31;
        --color-surface-variant: 222 227 225;
        --color-on-surface-variant: 66 72 70;
        --color-outline: 114 120 118;
    `;
    const dark = `
        --color-primary: 31 200 167;
        --color-on-primary: 0 56 46;
        --color-background: 18 18 18;
        --color-on-background: 228 226 230;
        --color-surface: 18 18 18;
        --color-on-surface: 228 226 230;
        --color-surface-variant: 66 72 70;
        --color-on-surface-variant: 194 199 197;
        --color-outline: 140 146 144;
    `;
    return `
        :root { ${theme === 'light' ? light : dark} }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
        }
        body { font-family: 'Roboto', sans-serif; background-color: rgb(var(--color-background)); color: rgb(var(--color-on-background)); margin: 0; padding: 2rem; }
        .container { max-width: 800px; margin: auto; }
        .header { text-align: center; border-bottom: 1px solid rgb(var(--color-outline)); padding-bottom: 1rem; margin-bottom: 2rem; }
        .header h1 { font-size: 2.5rem; color: rgb(var(--color-primary)); margin: 0; }
        .header p { font-size: 1rem; color: rgb(var(--color-on-surface-variant)); margin: 0.25rem 0 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .summary-card { background-color: rgb(var(--color-surface-variant)); padding: 1rem; border-radius: 1rem; text-align: center; }
        .summary-card-title { font-size: 0.875rem; color: rgb(var(--color-on-surface-variant)); margin: 0 0 0.5rem; }
        .summary-card-value { font-size: 1.75rem; font-weight: 700; color: rgb(var(--color-on-surface-variant)); margin: 0; }
        .chart-container { background-color: rgb(var(--color-surface-variant)); padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; }
        .chart-container h2 { margin: 0 0 1rem; text-align: center; color: rgb(var(--color-on-surface-variant)); }
        .table-container { page-break-before: always; }
        h2 { font-size: 1.5rem; margin: 2rem 0 1rem; color: rgb(var(--color-on-background)); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid rgb(var(--color-outline)); }
        th { font-size: 0.875rem; color: rgb(var(--color-on-surface-variant)); }
        .amount { text-align: right; font-weight: 500; }
        .print-btn { position: fixed; top: 1rem; right: 1rem; background-color: rgb(var(--color-primary)); color: rgb(var(--color-on-primary)); border: none; padding: 0.75rem 1.5rem; border-radius: 99px; cursor: pointer; font-size: 1rem; }
        footer { text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgb(var(--color-outline)); font-size: 0.875rem; color: rgb(var(--color-on-surface-variant)); }
    `;
};

const getChartSVG = (chartId: string): string => {
    // Recharts renders SVGs inside a div with class '.recharts-wrapper'
    // We target the chartId passed from InsightsDashboard to find the right one.
    const chartWrapper = document.querySelector(`#${chartId} .recharts-wrapper`);
    if (chartWrapper && chartWrapper.innerHTML) {
        // We need to add the xmlns attribute for the SVG to render correctly standalone
        return chartWrapper.innerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }
    return '<p>Chart could not be rendered.</p>';
}

const generateReport = (transactions: Transaction[], period: Period, theme: Theme): string => {
    const now = new Date();
    const startOfPeriod = new Date(now);
    switch (period) {
        case 'D': startOfPeriod.setHours(0, 0, 0, 0); break;
        case 'W': startOfPeriod.setDate(now.getDate() - now.getDay()); startOfPeriod.setHours(0, 0, 0, 0); break;
        case 'M': startOfPeriod.setDate(1); startOfPeriod.setHours(0, 0, 0, 0); break;
        case 'Y': startOfPeriod.setMonth(0, 1); startOfPeriod.setHours(0, 0, 0, 0); break;
    }

    const filteredTxs = transactions.filter(tx => tx.ts >= startOfPeriod.getTime());
    const totalSpent = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const avgMood = filteredTxs.length > 0 ? Math.round(filteredTxs.reduce((sum, tx) => sum + tx.mood, 0) / filteredTxs.length) : 3;

    const moodChartSVG = getChartSVG('mood-chart-widget');
    const categoryChartSVG = getChartSVG('category-chart-widget');

    const transactionsHtml = filteredTxs.map(tx => `
        <tr>
            <td>${new Date(tx.ts).toLocaleDateString('en-IN')}</td>
            <td>${tx.merchant || tx.category}</td>
            <td>${tx.category}</td>
            <td>${MOOD_MAP[tx.mood].label}</td>
            <td class="amount">${formatCurrency(tx.amount)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sentimint Financial Report</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>${generateCSS(theme)}</style>
        </head>
        <body>
            <button class="print-btn no-print" onclick="window.print()">Print or Save as PDF</button>
            <div class="container">
                <header class="header">
                    <h1>Sentimint Report</h1>
                    <p>${getPeriodString(period)} Summary for ${now.toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                </header>

                <main>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <h2 class="summary-card-title">Total Spent</h2>
                            <p class="summary-card-value">${formatCurrency(totalSpent)}</p>
                        </div>
                        <div class="summary-card">
                            <h2 class="summary-card-title">Transactions</h2>
                            <p class="summary-card-value">${filteredTxs.length}</p>
                        </div>
                        <div class="summary-card">
                            <h2 class="summary-card-title">Average Mood</h2>
                            <p class="summary-card-value">${MOOD_MAP[avgMood as keyof typeof MOOD_MAP].label}</p>
                        </div>
                    </div>

                    <div class="chart-container">
                        <h2>Spending by Mood</h2>
                        ${moodChartSVG}
                    </div>

                     <div class="chart-container">
                        <h2>Top 5 Categories</h2>
                        ${categoryChartSVG}
                    </div>

                    <div class="table-container">
                        <h2>All Transactions</h2>
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Mood</th><th class="amount">Amount</th></tr>
                            </thead>
                            <tbody>
                                ${transactionsHtml}
                            </tbody>
                        </table>
                    </div>
                </main>
                <footer>Generated by Sentimint on ${new Date().toLocaleString('en-IN')}</footer>
            </div>
        </body>
        </html>
    `;
};

export const reportService = {
    generateReport,
};
