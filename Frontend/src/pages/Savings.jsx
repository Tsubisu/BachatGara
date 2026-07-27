import React, { useState } from 'react';
import { Target, Calendar, Landmark, Check, Trash2, ShieldAlert } from 'lucide-react';
import { goalsApi } from '../services/api';
import { useDialog } from '../context/DialogContext';

export default function Savings({
  savings = [],
  setSavings,
  netSavings = 0,
  setNetSavings,
  trackedAccounts = [],
  setTrackedAccounts,
  onDataRefresh
}) {
  const { showConfirm, showAlert } = useDialog();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');

  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [sourceAccId, setSourceAccId] = useState('');

  const [goalError, setGoalError] = useState('');

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!name || !target) return;
    setGoalError('');
    try {
      await goalsApi.create({
        name,
        target_amount: parseFloat(target),
        target_date: date || null,
      });
      setName('');
      setTarget('');
      setDate('');
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setGoalError(err.message);
    }
  };

  const handleOpenFundModal = (goalId) => {
    setSelectedGoalId(goalId);
    setSourceAccId(trackedAccounts[0]?.id || '');
    setFundAmount('');
    setShowFundModal(true);
  };

  const [fundError, setFundError] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  const handleConfirmFunding = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(fundAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFundError('Please enter a valid amount.');
      return;
    }
    if (!sourceAccId) {
      setFundError('Please select a bank account.');
      return;
    }
    setFundError('');
    setFundLoading(true);
    try {
      await goalsApi.fund(selectedGoalId, {
        source_account_id: sourceAccId,
        amount: amountVal,
      });
      setShowFundModal(false);
      setSelectedGoalId(null);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setFundError(err.message);
    } finally {
      setFundLoading(false);
    }
  };

  const handleDeleteGoal = async (id, goalName) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete the savings goal "${goalName || ''}"?`,
      { title: 'Delete Savings Goal', type: 'error', confirmLabel: 'Delete Goal', cancelLabel: 'Cancel' }
    );
    if (!confirmed) return;
    try {
      await goalsApi.remove(id);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      await showAlert(`Failed to delete savings goal: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  const selectedGoal = (savings || []).find(s => s.id === selectedGoalId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Net Savings Balance</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', color: 'var(--color-primary)' }}>
            Rs. {(netSavings || 0).toLocaleString()}
          </h2>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Secured across {(savings || []).length} active targets</span>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🐖 Setup a New Savings Goal</span>
        </h3>
        <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Goal name (e.g. Buy laptop)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ flex: 2 }}
          />
          <input
            type="number"
            placeholder="Target (Rs.)"
            value={target}
            onChange={e => setTarget(e.target.value)}
            required
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <button type="submit" className="btn-primary">Add Goal</button>
        </form>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '18px', fontWeight: '700', fontSize: '17px' }}>🎯 Track Active Goals</h3>

        {savings.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>No active savings goals. Create one above to get started!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {savings.map(s => {
              const percentage = (s.current / s.target) * 100;
              return (
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
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target: Rs. {(s.target || 0).toLocaleString()} {s.date ? `• By ${s.date}` : ''}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    <span>Progress: {Math.round(percentage || 0)}%</span>
                    <span style={{ color: 'var(--color-primary)' }}>Rs. {(s.current || 0).toLocaleString()}</span>
                  </div>

                  <div style={{ background: 'var(--bg-accent)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${Math.min(percentage || 0, 100)}%`, background: 'var(--color-primary)', height: '100%', borderRadius: '4px' }}></div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleOpenFundModal(s.id)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Landmark size={14} />
                      <span>+ Fund Goal</span>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(s.id, s.name)}
                      className="btn-primary"
                      style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', flex: 1, padding: '8px 12px', fontSize: '12px', borderRadius: '8px', boxShadow: 'none' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showFundModal && selectedGoal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text-primary)' }}>
              🐖 Fund Goal: "{selectedGoal.name}"
            </h3>

            <form onSubmit={handleConfirmFunding} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>Draw Cash From Bank Account</label>
                <select
                  value={sourceAccId}
                  onChange={e => setSourceAccId(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {(trackedAccounts || []).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} (Available: Rs. {(a.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>Funding Amount (Rs.)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  max={(selectedGoal.target || 0) - (selectedGoal.current || 0)}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Required to reach target: Rs. {Math.max(0, (selectedGoal.target || 0) - (selectedGoal.current || 0)).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowFundModal(false)}
                  style={{ flex: 1, background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
