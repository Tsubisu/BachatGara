import React, { useState } from 'react';
import { transactionsApi } from '../services/api';

const parseLocalSms = (body) => {
  const cleanBody = body.trim();
  
  const debitMatch = cleanBody.match(/(?:Fund\s+transfer\s+to\s+(.*?)(?:\s+A\/C)?\s+)?(?:NPR|Rs\.?)\s*([0-9,.]+)\s+(?:has\s+been\s+)?debited\s+from\s+A\/C\s*([X*\d]+)/i) ||
                     cleanBody.match(/A\/C\s*([X*\d]+)?\s*(?:is|has\s+been)?\s*debited\s+(?:by|with|for)\s+(?:NPR|Rs\.?)\s*([0-9,.]+)(?:.*?\b(?:Info:|Remarks:|for)\s*(.*?)(?:\.|$)|.*)/i) ||
                     cleanBody.match(/(?:NPR|Rs\.?)\s*([0-9,.]+)\s+debited\s+from\s+(?:your\s+)?A\/C\s*([X*\d]+)?(?:.*?\b(?:Info:|Remarks:|for)\s*(.*?)(?:\.|$)|.*)/i);

  if (debitMatch) {
    let amt, desc;
    if (debitMatch[2] && !isNaN(parseFloat(debitMatch[2].replace(/,/g, '')))) {
      amt = parseFloat(debitMatch[2].replace(/,/g, ''));
      desc = debitMatch[1] ? `Payment to ${debitMatch[1].trim()}` : (debitMatch[3] ? debitMatch[3].trim() : 'Bank Debit');
    } else if (debitMatch[1] && !isNaN(parseFloat(debitMatch[1].replace(/,/g, '')))) {
      amt = parseFloat(debitMatch[1].replace(/,/g, ''));
      desc = debitMatch[3] ? debitMatch[3].trim() : 'Bank Debit';
    }
    if (amt) {
      return { amount: amt, type: 'expense', account: 'Bank Account', description: desc || 'Bank Debit', category: 'Food & Drinks' };
    }
  }

  const creditMatch = cleanBody.match(/A\/C\s*([X*\d]+)?\s*(?:is|has\s+been)?\s*credited\s+(?:by|with|for)\s+(?:NPR|Rs\.?)\s*([0-9,.]+)(?:.*?\b(?:Info:|Remarks:|for)\s*(.*?)(?:\.|$)|.*)/i) ||
                      cleanBody.match(/(?:NPR|Rs\.?)\s*([0-9,.]+)\s+credited\s+to\s+(?:your\s+)?A\/C\s*([X*\d]+)?(?:.*?\b(?:Info:|Remarks:|for)\s*(.*?)(?:\.|$)|.*)/i);
  if (creditMatch) {
    let amt, desc;
    if (creditMatch[2] && !isNaN(parseFloat(creditMatch[2].replace(/,/g, '')))) {
      amt = parseFloat(creditMatch[2].replace(/,/g, ''));
      desc = creditMatch[3] ? creditMatch[3].trim() : 'Bank Credit';
    } else if (creditMatch[1] && !isNaN(parseFloat(creditMatch[1].replace(/,/g, '')))) {
      amt = parseFloat(creditMatch[1].replace(/,/g, ''));
      desc = creditMatch[3] ? creditMatch[3].trim() : 'Bank Credit';
    }
    if (amt) {
      return { amount: amt, type: 'income', account: 'Bank Account', description: desc || 'Bank Credit', category: 'Salary' };
    }
  }

  return null;
};

export default function Transactions({ transactions, setTransactions, categories, trackedAccounts = [], onDataRefresh }) {
  const [smsInput, setSmsInput] = useState('');
  const [smsError, setSmsError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const [smsLoading, setSmsLoading] = useState(false);

  const handleSmsParse = async (e) => {
    e.preventDefault();
    if (!smsInput.trim()) return;

    const parsed = parseLocalSms(smsInput);
    if (!parsed) {
      setSmsError('SMS pattern could not be recognized. Try pasting a standard eSewa, Fonepay, or bank alert SMS.');
      return;
    }

    setSmsError('');
    setSmsLoading(true);
    try {
      await transactionsApi.addManual({
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        category_name: parsed.category,
        account_name: null,
        date: new Date().toISOString().split('T')[0],
      });
      setSmsInput('');
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setSmsError(`Failed to save: ${err.message}`);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Account'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.amount,
      t.type,
      t.account
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bachatgara_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryConfig = (catName) => {
    return categories.find(c => c.name === catName) || { color: '#64748b', icon: '📝' };
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesType = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card">
        <h3 style={{ marginBottom: '8px', fontWeight: '700', fontSize: '17px' }}>📱 SMS Auto-Parse Tool</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Forward transaction alerts from your Android gateway device. Paste a notification from eSewa, Khalti, Fonepay, or Nabil Bank to parse and log automatically.
        </p>
        <form onSubmit={handleSmsParse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea 
            rows="3" 
            placeholder="e.g. Sent Rs. 150.00 to Ram Bahadur Ref: 482910"
            value={smsInput}
            onChange={e => setSmsInput(e.target.value)}
            style={{ width: '100%', resize: 'none' }}
          />
          {smsError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: '600' }}>⚠️ {smsError}</span>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
              onClick={() => setSmsInput('Sent Rs. 3,500.00 to WorldLink Bill Ref: WL2901')}
            >
              Demo eSewa
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
              onClick={() => setSmsInput('successfully paid Rs. 1200.00 to QFX Cinemas Ref: QFX9920')}
            >
              Demo Khalti
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
              onClick={() => setSmsInput('You have paid Rs. 450.00 to BhatBhateni via Fonepay Ref: BB9876.')}
            >
              Demo Fonepay
            </button>
            <button type="submit" className="btn-primary" disabled={smsLoading}>{smsLoading ? 'Saving...' : 'Parse & Log'}</button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '17px' }}>💸 Complete Transactions Ledger</h3>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '650px', justifyContent: 'flex-end' }}>
            <input 
              type="text" 
              placeholder="Search ledger..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '160px', padding: '8px 12px', fontSize: '13px' }}
            />
            
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              style={{ width: '130px', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
            
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              style={{ width: '110px', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="All">All Types</option>
              <option value="income">Inflow (+)</option>
              <option value="expense">Outflow (-)</option>
            </select>

            <button 
              onClick={handleExportCSV} 
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--color-secondary)' }}
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlignment: 'center', color: 'var(--text-secondary)' }}>
              No transactions match your current filters.
            </div>
          ) : (
            filtered.map(t => {
              const catConfig = getCategoryConfig(t.category);
              const isExpense = t.type === 'expense' || t.type === 'debit' || t.type === 'transfer';
              return (
                <div 
                  key={t.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 18px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: 'var(--border-radius-sm)', 
                    border: '1px solid var(--border-color)' 
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{t.description}</h4>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', alignItems: 'center' }}>
                      <span>{t.date}</span>
                      <span>•</span>
                      <span style={{ 
                        color: catConfig.color, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        background: `${catConfig.color}15`, 
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        <span>{catConfig.icon}</span>
                        <span>{t.category}</span>
                      </span>
                      <span>•</span>
                      <span style={{ background: 'var(--bg-accent)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{t.account}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <strong style={{ fontSize: '15px', color: isExpense ? '#ef4444' : '#10b981' }}>
                      {isExpense ? '-' : '+'} Rs. {t.amount.toLocaleString()}
                    </strong>
                    <button 
                      onClick={async () => {
                        try {
                          await transactionsApi.remove(t.id);
                          if (onDataRefresh) await onDataRefresh();
                        } catch (err) {
                          alert(`Delete failed: ${err.message}`);
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center' }}
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
