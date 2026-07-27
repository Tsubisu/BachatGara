import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Calendar as CalendarIcon, ArrowRight, Bell, AlertTriangle, ShieldCheck, Wallet, Sparkles, X, Check, Trash2 } from 'lucide-react';
import { transactionsApi, alertsApi, budgetsApi } from '../services/api';
import { useDialog } from '../context/DialogContext';
import CustomDropdown from '../components/CustomDropdown';

export default function Dashboard({
  user,
  transactions,
  setTransactions,
  budgetPlans,
  setBudgetPlans,
  balance,
  categories,
  trackedAccounts = [],
  setTrackedAccounts,
  unresolvedAlerts = [],
  setUnresolvedAlerts,
  netSavings,
  setNetSavings,
  onDataRefresh
}) {
  const activePlan = budgetPlans.find(p => p.active);

  const [newDesc, setNewDesc] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const [newType, setNewType] = useState('expense');
  const [newCat, setNewCat] = useState(categories[0]?.name || 'Other');
  const [newAcc, setNewAcc] = useState(trackedAccounts[0]?.bankName || 'Cash');

  const [resolvingAlert, setResolvingAlert] = useState(null);
  const [resDesc, setResDesc] = useState('');
  const [resCat, setResCat] = useState(categories[0]?.name || 'Other');
  const [isTransfer, setIsTransfer] = useState(false);
  const [destAccountId, setDestAccountId] = useState('');
  const [serviceFee, setServiceFee] = useState('0');

  const [rolloverChoice, setRolloverChoice] = useState('savings');
  const [rolloverTargetPlanId, setRolloverTargetPlanId] = useState('');

  const [submitError, setSubmitError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDesc || !newAmt) return;
    setSubmitError('');
    try {
      await transactionsApi.addManual({
        description: newDesc,
        amount: parseFloat(newAmt),
        type: newType,
        category_name: newCat,
        account_name: newAcc === 'Cash' ? null : newAcc,
        date: new Date().toISOString().split('T')[0],
      });
      setNewDesc('');
      setNewAmt('');
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const { showConfirm, showAlert } = useDialog();

  const [resolveError, setResolveError] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const handleDiscardAlert = async (alertId) => {
    const confirmed = await showConfirm(
      'Discard this parsed SMS alert from queue inbox?',
      { title: 'Discard Alert', confirmLabel: 'Discard Alert' }
    );
    if (!confirmed) return;
    try {
      await alertsApi.discard(alertId);
      setUnresolvedAlerts(prev => prev.filter(a => a.id !== alertId));
      if (resolvingAlert?.id === alertId) setResolvingAlert(null);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      await showAlert(`Failed to discard alert: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  const handleResolveAlert = async (e) => {
    e.preventDefault();
    if (!resolvingAlert || !resDesc.trim()) return;
    setResolveError('');
    setResolveLoading(true);

    try {
      await alertsApi.resolve(resolvingAlert.id, {
        description: resDesc,
        category_name: resCat,
        is_transfer: isTransfer,
        dest_account_id: destAccountId || null,
        service_fee: parseFloat(serviceFee) || 0,
      });

      setUnresolvedAlerts(prev => prev.filter(a => a.id !== resolvingAlert.id));
      setResolvingAlert(null);
      setResDesc('');
      setIsTransfer(false);
      setDestAccountId('');
      setServiceFee('0');

      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setResolveError(err.message);
    } finally {
      setResolveLoading(false);
    }
  };

  const openResolveModal = (alertItem) => {
    setResolvingAlert(alertItem);
    const datePart = alertItem.timestamp ? alertItem.timestamp.split(' ')[0] : '';
    setResDesc(`${alertItem.bankName} ${alertItem.type === 'debit' ? 'Expense' : 'Income'} (${datePart})`);
    setIsTransfer(false);
    setServiceFee('0');

    const otherAcc = trackedAccounts.find(a => a.isActive !== false && a.bankName !== alertItem.bankName);
    if (otherAcc) {
      setDestAccountId(otherAcc.id);
    } else {
      setDestAccountId('');
    }
  };

  const today = new Date();
  const activePlanIsExpired = activePlan && new Date(activePlan.endDate) < today;

  const handleRolloverResolve = async () => {
    if (!activePlan) return;
    const { overallSpent } = calculatePlanSpent(activePlan);
    const leftover = Math.max(0, activePlan.totalPool - overallSpent);
    try {
      await budgetsApi.rollover(activePlan.id, {
        action: rolloverChoice,
        target_plan_id: rolloverTargetPlanId || null,
        leftover_amount: leftover,
      });
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      alert(`Rollover failed: ${err.message}`);
    }
  };

  let planTotalSpent = 0;
  let planAllocationsList = [];
  let daysRemaining = 0;

  const calculatePlanSpent = (plan) => {
    if (!plan || !plan.startDate || !plan.endDate) return { overallSpent: 0, allocationsList: [] };
    const startStr = String(plan.startDate).split('T')[0];
    const endStr = String(plan.endDate).split('T')[0];
    const planTx = (transactions || []).filter(t => {
      if (!t || !t.date) return false;
      const txDateStr = String(t.date).split('T')[0];
      return txDateStr >= startStr && txDateStr <= endStr;
    });
    let spentSum = 0;
    const categoryList = Object.entries(plan.allocations || {}).map(([catName, limit]) => {
      const spent = planTx
        .filter(t => t.type === 'expense' && t.category === catName)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      spentSum += spent;
      return { category: catName, limit, spent };
    });
    return { overallSpent: spentSum, allocationsList: categoryList };
  };

  if (activePlan && !activePlanIsExpired) {
    const endDate = new Date(activePlan.endDate);
    const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const cleanEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    daysRemaining = Math.ceil((cleanEnd - cleanToday) / (1000 * 60 * 60 * 24));

    const { overallSpent, allocationsList } = calculatePlanSpent(activePlan);
    planTotalSpent = overallSpent;
    planAllocationsList = allocationsList;
  }

  const getCategoryConfig = (catName) => {
    return categories.find(c => c.name === catName) || { color: '#64748b', icon: '📝' };
  };

  const activeAlerts = unresolvedAlerts.filter(a => !a.resolved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.75px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Hello, {user?.profile_name || 'User'}!</span>
            <span className="animate-wave" style={{ display: 'inline-block', transformOrigin: '70% 70%' }}>👋</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px', fontWeight: '500' }}>
            Here is your financial status and parsed SMS tracking logs summary.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {activePlan && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
              <span>Active Plan: <strong>{activePlan.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {activePlanIsExpired && (
        <div className="warning-banner" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-warning)' }}>
            <AlertTriangle size={18} />
            <strong style={{ fontSize: '14px' }}>Active Budget Plan Has Expired!</strong>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Plan <strong>"{activePlan.name}"</strong> ended on {activePlan.endDate}. Resolve remaining pool funds to continue tracking.
          </p>

          {(() => {
            const { overallSpent } = calculatePlanSpent(activePlan);
            const leftover = Math.max(0, activePlan.totalPool - overallSpent);
            return (
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Unspent Pool Leftover: <strong style={{ color: 'var(--color-primary)' }}>Rs. {leftover.toLocaleString()}</strong>
                </span>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="rolloverOption"
                      value="savings"
                      checked={rolloverChoice === 'savings'}
                      onChange={() => setRolloverChoice('savings')}
                    />
                    Save to Emergency Savings
                  </label>
                  <label style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="rolloverOption"
                      value="cash"
                      checked={rolloverChoice === 'cash'}
                      onChange={() => setRolloverChoice('cash')}
                    />
                    Return to Unallocated Cash
                  </label>
                </div>

                <button
                  onClick={handleRolloverResolve}
                  className="btn-primary"
                  style={{ marginTop: '14px', padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Resolve leftovers</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {balance < 0 && (
        <div className="warning-banner">
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.125rem' }}>Negative Cash Alert!</strong>
            <span>Your tracked expenses exceed your tracked bank balances. Please configure your accounts starting balances.</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ borderLeft: '0.25rem solid var(--color-primary)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Net Cash Value (Usable)</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.375rem', color: 'var(--text-primary)' }}>
            Rs. {balance.toLocaleString()}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Usable bank accounts balance</span>
        </div>
        <div className="glass-card" style={{ borderLeft: '0.25rem solid var(--color-secondary)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Net Savings</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.375rem', color: 'var(--color-primary)' }}>
            Rs. {netSavings.toLocaleString()}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Locked savings goals assets</span>
        </div>
        <div className="glass-card" style={{ borderLeft: '0.25rem solid var(--color-tertiary)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Alerts</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.375rem', color: activeAlerts.length > 0 ? 'var(--color-tertiary)' : 'var(--text-primary)' }}>
            {activeAlerts.length} Unresolved
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Parsed SMS queue inbox</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.0625rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} className="md-tertiary" />
            <span>Parsed SMS Inbox Queue</span>
            {activeAlerts.length > 0 && (
              <span style={{ background: 'var(--color-danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' }}>
                {activeAlerts.length}
              </span>
            )}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>
            SMS notifications parsed from Nepalese bank alerts. Resolve items to ledger categories or register transfers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {activeAlerts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
                <ShieldCheck size={28} style={{ color: 'var(--color-primary)', display: 'block', margin: '0 auto 8px' }} />
                <span>Inbox resolved. Tracked banks up-to-date!</span>
              </div>
            ) : (
              activeAlerts.map(alert => {
                const isExpense = alert.type === 'debit' || alert.type === 'expense';
                return (
                  <div
                    key={alert.id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${isExpense ? '#ef444440' : '#10b98140'}`,
                      borderRadius: 'var(--border-radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        {alert.bankName}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        background: isExpense ? '#ef444415' : '#10b98115',
                        color: isExpense ? '#ef4444' : '#10b981'
                      }}>
                        {isExpense ? '💸 Transfer / Debit' : '💰 Money Received'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{alert.timestamp.split(' ')[1]}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', lineHeight: '1.4' }}>
                      {alert.rawBody}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: isExpense ? '#ef4444' : '#10b981' }}>
                        {isExpense ? '-' : '+'} Rs. {alert.amount.toLocaleString()}
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDiscardAlert(alert.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                          title="Discard / Delete Alert"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          onClick={() => openResolveModal(alert)}
                          className="btn-primary"
                          style={{ padding: '4px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Resolve</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontWeight: '700', fontSize: '1.0625rem', marginBottom: '4px' }}>✍️ Manual Ledger Log</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>Input casual cash transactions manually.</p>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Transaction description"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="number"
                  placeholder="Amount (Rs.)"
                  value={newAmt}
                  onChange={e => setNewAmt(e.target.value)}
                  required
                />
                <select value={newType} onChange={e => setNewType(e.target.value)}>
                  <option value="expense">Outflow (-)</option>
                  <option value="income">Inflow (+)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ height: '42px' }}>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <CustomDropdown
                  options={[
                    { value: 'Cash', label: 'Default Cash Account', type: 'cash' },
                    ...trackedAccounts.filter(a => a.isActive !== false && a.type !== 'cash').map(a => ({
                      value: a.bankName,
                      label: a.bankName,
                      bankName: a.bankName,
                      accountMask: a.accountMask,
                      logo_url: a.logo_url
                    }))
                  ]}
                  value={newAcc}
                  onChange={setNewAcc}
                />
              </div>

              {submitError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: '600' }}>⚠️ {submitError}</span>}

              <button type="submit" className="btn-primary" style={{ width: '100%', height: '42px', marginTop: '4px' }}>
                Save Transaction Entry
              </button>
            </form>
          </div>

          {activePlan && !activePlanIsExpired && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Active Budget Plan Limit</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{daysRemaining} day(s) left</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '6px' }}>
                <div style={{
                  width: `${Math.min((planTotalSpent / activePlan.totalPool) * 100, 100)}%`,
                  background: planTotalSpent > activePlan.totalPool ? 'var(--color-danger)' : 'var(--color-primary)',
                  height: '100%'
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Rs. {planTotalSpent.toLocaleString()} spent</span>
                <span>Rs. {activePlan.totalPool.toLocaleString()} limit</span>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem', fontWeight: '700', fontSize: '1.0625rem' }}>💸 Recent Cash Book Entries</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {transactions.slice(0, 5).map(t => {
            const catConfig = getCategoryConfig(t.category);
            const isExpense = t.type === 'expense' || t.type === 'debit' || t.type === 'transfer';
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1.125rem',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{t.description}</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '0.25rem', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', alignItems: 'center' }}>
                    <span>{t.date}</span>
                    <span>•</span>
                    <span style={{
                      color: catConfig.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
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
                <strong style={{ fontSize: '15px', color: isExpense ? '#ef4444' : '#10b981' }}>
                  {isExpense ? '-' : '+'} Rs. {t.amount.toLocaleString()}
                </strong>
              </div>
            );
          })}
        </div>
      </div>

      {resolvingAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifycontent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <button
              onClick={() => setResolvingAlert(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text-primary)' }}>
              Resolve SMS Alert
            </h3>

            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Raw Bank SMS</span>
              <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: '1.4' }}>{resolvingAlert.rawBody}</p>
            </div>

            <form onSubmit={handleResolveAlert} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Transaction Description (Edit to readable name)</label>
                <input
                  type="text"
                  value={resDesc}
                  onChange={e => setResDesc(e.target.value)}
                  placeholder="e.g. Bought Groceries at BhatBhateni"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="radio"
                      name="txKind"
                      checked={!isTransfer}
                      onChange={() => setIsTransfer(false)}
                    />
                    Category {resolvingAlert.type === 'debit' ? 'Expense' : 'Income'}
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="radio"
                      name="txKind"
                      checked={isTransfer}
                      onChange={() => setIsTransfer(true)}
                    />
                    Internal Bank Transfer
                  </label>
                </div>

                {isTransfer && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>
                        {resolvingAlert.type === 'debit' ? 'Transfer Money Into (Destination Bank)' : 'Money Transferred From (Source Bank)'}
                      </label>
                      <CustomDropdown
                        options={trackedAccounts
                          .filter(a => a.isActive !== false && a.bankName !== resolvingAlert.bankName)
                          .map(a => ({
                            value: a.id,
                            label: `${a.bankName} (${a.accountMask || 'No mask'})`,
                            bankName: a.bankName,
                            accountMask: a.accountMask,
                            logo_url: a.logo_url
                          }))}
                        value={destAccountId}
                        onChange={setDestAccountId}
                        placeholder={resolvingAlert.type === 'debit' ? '-- Select Destination Bank --' : '-- Select Source Bank --'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>Bank Charge / Transfer Fee (Rs.)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={serviceFee}
                        onChange={e => setServiceFee(e.target.value)}
                        placeholder="e.g. 10 or 15"
                      />
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        If specified, this fee will be deducted from the sending bank's balance as a bank charge.
                      </span>
                    </div>
                  </div>
                )}

                {!isTransfer && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
                    <select value={resCat} onChange={e => setResCat(e.target.value)}>
                      {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {resolveError && (
                <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  ⚠️ {resolveError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setResolvingAlert(null)}
                  style={{ flex: 1, background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, opacity: resolveLoading ? 0.7 : 1 }} disabled={resolveLoading}>
                  {resolveLoading ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
