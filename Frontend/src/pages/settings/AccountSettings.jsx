import React, { useState } from 'react';
import { Landmark, Trash2, PlusCircle, Check } from 'lucide-react';
import { accountsApi } from '../../services/api';

const bankOptions = [
  'Agricultural Development Bank (ADBL)',
  'Citizens Bank',
  'Everest Bank',
  'Global IME Bank',
  'Himalayan Bank',
  'Kumari Bank',
  'Laxmi Sunrise Bank',
  'Machhapuchhre Bank',
  'Nabil Bank',
  'Nepal Bank Ltd',
  'Nepal Investment Mega Bank (NIMB)',
  'NIC Asia Bank',
  'NMB Bank',
  'Prabhu Bank',
  'Prime Commercial Bank',
  'Rastriya Banijya Bank',
  'Sanima Bank',
  'Siddhartha Bank',
  'Standard Chartered Bank',
  'Other Bank'
].sort((a, b) => a.localeCompare(b));

export default function AccountSettings({ trackedAccounts = [], onDataRefresh }) {
  const [bankName, setBankName] = useState('');
  const [accountMask, setAccountMask] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [accError, setAccError] = useState('');
  const [loading, setLoading] = useState(false);

  const sortedTrackedAccounts = [...trackedAccounts].sort((a, b) =>
    (a.bankName || '').localeCompare(b.bankName || '')
  );

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!bankName.trim() || !bankBalance) return;
    setAccError('');
    setLoading(true);
    try {
      await accountsApi.create({
        name: bankName.trim(),
        type: 'bank',
        balance: parseFloat(bankBalance) || 0,
        account_mask: accountMask.trim() || null,
      });
      setBankName('');
      setAccountMask('');
      setBankBalance('');
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setAccError(err.message || 'Failed to add bank account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Stop tracking this bank account? Historical transaction links will remain.')) return;
    try {
      await accountsApi.remove(id);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <h3 style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Landmark size={20} className="md-primary" />
        <span>Tracked Bank Accounts &amp; SMS Masks</span>
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
        Register bank accounts with their exact SMS pattern label (e.g. <code>*1234</code>, <code>0#15</code>) so incoming SMS logs match correctly.
      </p>

      {accError && (
        <div className="warning-banner dark-warning-banner animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️ {accError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {sortedTrackedAccounts.map(acc => (
          <div 
            key={acc.id} 
            style={{ 
              padding: '16px', 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--border-radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{acc.bankName}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                SMS Mask Match: <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}>{acc.accountMask}</code>
              </span>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '8px' }}>
                Rs. {acc.balance.toLocaleString()}
              </span>
            </div>
            <button 
              onClick={() => handleDeleteAccount(acc.id)} 
              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
              title="Remove account"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
        <h4 style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PlusCircle size={16} className="md-primary" />
          <span>Add Bank Account to Track</span>
        </h4>
        <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>Bank Name</label>
            <select 
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Select Bank...</option>
              {bankOptions.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>SMS Account Mask (As in SMS)</label>
            <input 
              type="text" 
              placeholder="e.g. 0#15 or *1234" 
              value={accountMask}
              onChange={e => setAccountMask(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>Starting Balance (Rs.)</label>
            <input 
              type="number" 
              placeholder="e.g. 35000" 
              value={bankBalance}
              onChange={e => setBankBalance(e.target.value)}
              required
            />
          </div>
          <div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{loading ? 'Tracking...' : 'Track Bank'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
