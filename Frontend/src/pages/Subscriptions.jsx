import React, { useState } from 'react';
import { subscriptionsApi } from '../services/api';

export default function Subscriptions({ subscriptions, setSubscriptions, trackedAccounts = [], onDataRefresh }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [account, setAccount] = useState('');
  const [addError, setAddError] = useState('');

  const handleAddSub = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    setAddError('');
    // next billing date based on cycle
    const daysAhead = billingCycle === 'yearly' ? 365 : 30;
    const nextDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    try {
      await subscriptionsApi.create({
        name,
        amount: parseFloat(amount),
        billing_cycle: billingCycle,
        next_billing_date: nextDate,
        account_id: null, // Could be resolved by account name in future
      });
      setName('');
      setAmount('');
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await subscriptionsApi.remove(id);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Create Subscription Form */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '17px' }}>📅 Log a Subscription</h3>
        <form onSubmit={handleAddSub} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Service name (e.g. Netflix)" 
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ flex: 2 }}
          />
          <input 
            type="number" 
            placeholder="Monthly Cost (Rs.)" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} style={{ flex: 1 }}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {addError && <span style={{ color: '#ef4444', fontSize: '12px', width: '100%' }}>{addError}</span>}
          <button type="submit" className="btn-primary">Add Sub</button>
        </form>
      </div>

      {/* Grid list of subscriptions */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '18px', fontWeight: '700', fontSize: '17px' }}>📅 Active Billing Subscriptions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {subscriptions.map(s => (
            <div 
              key={s.id} 
              style={{ 
                padding: '20px', 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--border-radius-md)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px' 
              }}
            >
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{s.name}</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Charged monthly from: <strong style={{ color: 'var(--color-primary)' }}>{s.account}</strong></span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800' }}>Rs. {s.amount.toLocaleString()}</span>
                <span style={{ fontSize: '11px', background: 'var(--bg-accent)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', border: '1px solid var(--border-color)' }}>
                  Next due: {s.date}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button 
                  onClick={() => handleDelete(s.id)} 
                  className="btn-primary" 
                  style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--color-danger)', flex: 1, padding: '8px 12px', fontSize: '12px', borderRadius: '8px', boxShadow: 'none' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
