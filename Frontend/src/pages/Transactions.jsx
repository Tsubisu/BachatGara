import React, { useState } from 'react';
import { transactionsApi } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { Landmark, Check, Trash2, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

const parseLocalSms = (body) => {
  const cleanBody = body.trim();

  let amount = null;
  const currencyMatch = cleanBody.match(/(?:NPR|Rs\.?|NRs\.?)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (currencyMatch) {
    const val = parseFloat(currencyMatch[1].replace(/,/g, ''));
    if (val > 0 && val <= 100000) {
      amount = val;
    }
  }

  if (!amount) {
    const matches = [...cleanBody.matchAll(/(?:amount|with|for|of|is|paid|pay|debited|debit|credited|credit|load|loaded|deposit|deposited|transferred|transfer|received|spent|payment|topup|recharge|by)?\s*(?:NPR|Rs\.?|NRs\.?)?\s*\b([0-9,]+(?:\.[0-9]{1,2})?)\b/gi)];
    for (const m of matches) {
      const candidateStr = (m[1] || '').replace(/,/g, '');
      const candidateVal = parseFloat(candidateStr);
      if (!isNaN(candidateVal) && candidateVal > 0 && candidateVal <= 100000 && !/^(98|97|96)\d{8}$/.test(candidateStr)) {
        amount = candidateVal;
        break;
      }
    }
  }

  if (!amount || isNaN(amount) || amount <= 0 || amount > 100000) {
    return null;
  }

  const isIncome = /(credited|credit|received|deposited|deposit|refunded|refund|cashback|added|inward|topup|income|plus)/i.test(cleanBody);
  const isExpense = /(debited|debit|paid|spent|withdrawn|withdrawal|transferred|transfer|sent|load|loaded|payment|purchased|charge|fee|outward|successful|completed|recharge)/i.test(cleanBody);

  let type = 'expense';
  if (isIncome && !isExpense) {
    type = 'income';
  } else if (isIncome && isExpense) {
    if (/credited|credit|received|deposited|deposit|refunded|cashback/i.test(cleanBody)) {
      type = 'income';
    }
  }

  const remarksMatch = cleanBody.match(/(?:Info:|Remarks:|for|towards|to|payment to)\s*(.*?)(?:\.|$)/i);
  let description = remarksMatch && remarksMatch[1].trim() ? remarksMatch[1].trim() : (cleanBody.length > 50 ? cleanBody.substring(0, 47) + '...' : cleanBody);

  const category = type === 'income' ? 'Salary' : 'Other';

  return {
    amount,
    type,
    account: 'Bank Account',
    description,
    category
  };
};

export default function Transactions({ transactions, setTransactions, categories, trackedAccounts = [], onDataRefresh }) {
  const { showConfirm, showAlert } = useDialog();
  const [smsInput, setSmsInput] = useState('');
  const [smsError, setSmsError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const [selectedBank, setSelectedBank] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);

  const bankAccounts = trackedAccounts.filter(a => a.type !== 'cash' && (a.bankName && a.bankName.toLowerCase() !== 'cash') && a.isActive !== false);

  const handleSmsParse = (e) => {
    e.preventDefault();
    if (!smsInput.trim()) return;

    const parsed = parseLocalSms(smsInput);
    if (!parsed) {
      setSmsError('Bank SMS pattern could not be recognized. Try pasting a standard Nepalese commercial bank SMS alert.');
      setParsedResult(null);
      return;
    }

    setSmsError('');
    setParsedResult({
      ...parsed,
      account_name: selectedBank || (bankAccounts.length > 0 ? bankAccounts[0].bankName : null)
    });
  };

  const handleConfirmLog = async () => {
    if (!parsedResult) return;
    setSmsLoading(true);
    try {
      await transactionsApi.addManual({
        description: parsedResult.description,
        amount: parsedResult.amount,
        type: parsedResult.type,
        category_name: parsedResult.category,
        account_name: parsedResult.account_name || selectedBank || null,
        date: new Date().toISOString().split('T')[0],
      });
      setSmsInput('');
      setParsedResult(null);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setSmsError(`Failed to save: ${err.message}`);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleDiscardParsed = () => {
    setParsedResult(null);
    setSmsInput('');
    setSmsError('');
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

      {/* Bank SMS Auto-Parse Tool */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '8px', fontWeight: '700', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={20} className="md-primary" />
          <span>🏦 Bank SMS Parser Tool</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Paste incoming transaction SMS alerts from Nepalese commercial banks to extract amounts and descriptions automatically.
        </p>
        <form onSubmit={handleSmsParse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            rows="3"
            placeholder="e.g. A/C *1234 has been debited by NPR 1,500. Info: Grocery."
            value={smsInput}
            onChange={e => {
              setSmsInput(e.target.value);
              setParsedResult(null);
            }}
            style={{ width: '100%', resize: 'none' }}
          />
          {smsError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: '600' }}>⚠️ {smsError}</span>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Select Bank:</label>
              <select
                value={selectedBank}
                onChange={e => {
                  setSelectedBank(e.target.value);
                  if (parsedResult) {
                    setParsedResult(prev => prev ? { ...prev, account_name: e.target.value || null } : null);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-accent)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value="">Default / Auto Detect</option>
                {bankAccounts.map(b => (
                  <option key={b.id || b.bankName} value={b.bankName}>
                    {b.bankName} {b.accountMask ? `(${b.accountMask})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
              Parse Bank SMS
            </button>
          </div>
        </form>

        {/* Parsed Result Preview Card */}
        {parsedResult && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                <span>Parsed Bank SMS Result</span>
              </span>
              <span style={{
                fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                background: parsedResult.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: parsedResult.type === 'income' ? '#10b981' : '#ef4444'
              }}>
                {parsedResult.type.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Target Account</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {parsedResult.account_name || selectedBank || 'General Bank Account'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Amount</span>
                <strong style={{ fontSize: '15px', color: parsedResult.type === 'income' ? '#10b981' : 'var(--text-primary)' }}>
                  Rs. {parsedResult.amount.toLocaleString()}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Description</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{parsedResult.description}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Default Category</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{parsedResult.category}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleDiscardParsed}
                style={{
                  background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
                  padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Trash2 size={14} />
                <span>Discard</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmLog}
                className="btn-primary"
                disabled={smsLoading}
                style={{ padding: '6px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={14} />
                <span>{smsLoading ? 'Logging...' : 'Log to Ledger'}</span>
              </button>
            </div>
          </div>
        )}
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
              style={{ width: '140px', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id || c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ width: '120px', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="All">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="btn-primary"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 14px', fontSize: '13px' }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No transactions match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Description</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Account</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const catCfg = getCategoryConfig(t.category);
                  const isIncome = t.type === 'income';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {t.date}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t.description}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                          background: `${catCfg.color}15`, color: catCfg.color, border: `1px solid ${catCfg.color}30`
                        }}>
                          <span>{catCfg.icon}</span>
                          <span>{t.category}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {t.account || 'Cash Account'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: isIncome ? '#10b981' : 'var(--text-primary)' }}>
                        {isIncome ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
