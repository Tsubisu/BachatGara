import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Landmark, Plus, Check, Archive, RotateCcw, ShieldCheck } from 'lucide-react';
import { accountsApi, banksApi } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import CustomDropdown from '../../components/CustomDropdown';

const defaultSupportedBanks = [
  { name: 'Nabil Bank', mask: '*1234' },
  { name: 'Nepal Investment Mega Bank', mask: '*5678' },
  { name: 'Global IME Bank', mask: '*8888' },
  { name: 'Rastriya Banijya Bank', mask: '*9999' },
  { name: 'NMB Bank', mask: '*1111' },
  { name: 'Prabhu Bank', mask: '*2222' },
  { name: 'Siddhartha Bank', mask: '*3333' },
  { name: 'Laxmi Sunrise Bank', mask: '*4444' },
  { name: 'Sanima Bank', mask: '*7777' },
  { name: 'Himalayan Bank', mask: '*0000' },
  { name: 'Everest Bank', mask: '*5555' },
  { name: 'Machhapuchhre Bank', mask: '*6666' },
  { name: 'Kumari Bank', mask: '*7788' },
  { name: 'Citizens Bank', mask: '*9900' },
  { name: 'Prime Commercial Bank', mask: '*1122' },
  { name: 'Standard Chartered Bank', mask: '*3344' },
];

export default function AccountSettings({ trackedAccounts = [], onDataRefresh }) {
  const { showConfirm, showAlert } = useDialog();

  const [dbBanks, setDbBanks] = useState([]);
  const [selectedPresetBank, setSelectedPresetBank] = useState('');
  const [accountMask, setAccountMask] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [accError, setAccError] = useState('');

  const [transferModal, setTransferModal] = useState({
    isOpen: false,
    account: null,
    targetAccountId: 'cash',
  });

  useEffect(() => {
    async function loadDbBanks() {
      try {
        const list = await banksApi.list();
        if (Array.isArray(list) && list.length > 0) {
          setDbBanks(list.filter(b => b.name !== 'Cash'));
        }
      } catch (err) {
        console.error('Failed to load bank logos:', err);
      }
    }
    loadDbBanks();
  }, []);

  const activeAccounts = trackedAccounts.filter(a => a.isActive !== false);
  const archivedAccounts = trackedAccounts.filter(a => a.isActive === false);

  const bankListToUse = dbBanks.length > 0 ? dbBanks : defaultSupportedBanks;

  const bankDropdownOptions = bankListToUse.map(b => {
    const presetMatch = defaultSupportedBanks.find(p => p.name.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(p.name.toLowerCase()));
    const maskStr = b.account_mask || (presetMatch ? presetMatch.mask : '');
    return {
      value: b.name,
      label: b.name,
      bankName: b.name,
      accountMask: maskStr,
      logo_url: b.logo_url
    };
  });

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setAccError('');

    if (!selectedPresetBank) {
      setAccError('Please select a bank from the list.');
      return;
    }

    try {
      await accountsApi.create({
        name: selectedPresetBank,
        account_mask: accountMask.trim() || null,
        type: 'bank',
        balance: parseFloat(startingBalance) || 0,
      });

      setSelectedPresetBank('');
      setAccountMask('');
      setStartingBalance('0');

      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      setAccError(err.message);
    }
  };

  const initiateArchive = (account) => {
    if (account.balance > 0) {
      setTransferModal({
        isOpen: true,
        account,
        targetAccountId: 'cash',
      });
    } else {
      executeArchive(account.id, null);
    }
  };

  const performArchiveCall = async (id, targetAccountId) => {
    try {
      await accountsApi.archive(id, targetAccountId);
      setTransferModal({ isOpen: false, account: null, targetAccountId: 'cash' });
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      await showAlert(`Archive failed: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  const executeArchive = async (id, targetAccountId) => {
    const confirmed = await showConfirm(
      'Archive this bank account? Archived accounts will be hidden from Android tracking and net cash calculations.',
      { title: 'Archive Bank Account', confirmLabel: 'Archive Account' }
    );
    if (!confirmed) return;
    await performArchiveCall(id, targetAccountId);
  };

  const executeReactivate = async (id) => {
    try {
      await accountsApi.reactivate(id);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      await showAlert(`Reactivation failed: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  const handleConfirmTransferModal = async () => {
    if (!transferModal.account) return;
    const targetId = transferModal.targetAccountId === 'keep' ? null : transferModal.targetAccountId;
    await performArchiveCall(transferModal.account.id, targetId);
  };

  const combinedArchiveOptions = transferModal.account ? [
    {
      value: 'cash',
      label: `Transfer balance (Rs. ${transferModal.account.balance.toLocaleString()}) to Default Cash Account`,
      type: 'cash'
    },
    {
      value: 'keep',
      label: `Keep balance inside account (Archive as-is with Rs. ${transferModal.account.balance.toLocaleString()})`,
      bankName: 'Archive as-is'
    },
    ...activeAccounts
      .filter(acc => acc.id !== transferModal.account.id && acc.type !== 'cash' && acc.bankName.toLowerCase() !== 'cash')
      .map(acc => ({
        value: acc.id,
        label: `Transfer balance (Rs. ${transferModal.account.balance.toLocaleString()}) to ${acc.bankName} (${acc.accountMask || 'No mask'})`,
        bankName: acc.bankName,
        logo_url: acc.logo_url
      }))
  ] : [];

  return (
    <div>
      <h3 style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Landmark size={20} className="md-primary" />
        <span>Tracked Bank Accounts &amp; SMS Masks</span>
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
        Register bank accounts with their exact SMS pattern label (e.g. <code>*1234</code>, <code>0#15</code>). Archived banks are stored securely and can be reactivated anytime.
      </p>

      {accError && (
        <div className="warning-banner dark-warning-banner animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️ {accError}</span>
        </div>
      )}

      {/* Active Accounts Section */}
      <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Check size={16} style={{ color: '#10b981' }} />
        <span>Active Bank Accounts ({activeAccounts.length})</span>
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {activeAccounts.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
            No active bank accounts. Add one below.
          </div>
        ) : (
          activeAccounts.map(acc => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {acc.type === 'cash' || acc.bankName.toLowerCase() === 'cash' ? (
                    <span style={{ fontSize: '20px' }}>💵</span>
                  ) : acc.logo_url ? (
                    <img src={acc.logo_url} alt={acc.bankName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Landmark size={18} color="var(--text-muted)" />
                  )}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{acc.bankName}</strong>
                  {acc.type !== 'cash' && acc.bankName.toLowerCase() !== 'cash' && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                      SMS Mask: <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}>{acc.accountMask || 'N/A'}</code>
                    </span>
                  )}
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px' }}>
                    Rs. {acc.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              {acc.type === 'cash' || acc.bankName.toLowerCase() === 'cash' ? (
                <span style={{ fontSize: '11px', background: 'var(--bg-accent)', padding: '4px 10px', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: '600', border: '1px solid var(--border-color)' }}>
                  Default Base Account
                </span>
              ) : (
                <button
                  onClick={() => initiateArchive(acc)}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Archive bank account"
                >
                  <Archive size={14} />
                  <span>Archive</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Archived Accounts Section */}
      {archivedAccounts.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Archive size={16} />
            <span>Archived Bank Accounts ({archivedAccounts.length})</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {archivedAccounts.map(acc => (
              <div
                key={acc.id}
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: 0.85
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {acc.logo_url ? (
                      <img src={acc.logo_url} alt={acc.bankName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Landmark size={18} color="var(--text-muted)" />
                    )}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-secondary)' }}>{acc.bankName}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      Archived • Mask: {acc.accountMask || 'N/A'}
                    </span>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Rs. {acc.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => executeReactivate(acc.id)}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={14} />
                  <span>Reactivate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Bank Account Form */}
      <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '28px' }}>
        <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          <span>Add New Nepalese Bank Account</span>
        </h4>
        <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Bank Name &amp; Logo
            </label>
            <CustomDropdown
              options={bankDropdownOptions}
              value={selectedPresetBank}
              onChange={(val) => {
                setSelectedPresetBank(val);
                const opt = bankDropdownOptions.find(b => b.value === val);
                if (opt && opt.accountMask) setAccountMask(opt.accountMask);
              }}
              placeholder="-- Select Bank --"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              SMS Account Mask / Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. *1234, 0#15"
              value={accountMask}
              onChange={e => setAccountMask(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Starting Balance (NPR)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={startingBalance}
              onChange={e => setStartingBalance(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
              min="0"
              step="any"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={16} />
              <span>Add Bank Account</span>
            </button>
          </div>
        </form>
      </div>

      {/* Supported Nepalese Banks & Preset SMS Masks Grid */}
      <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
        <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
          <span>Supported Nepalese Banks &amp; Default SMS Masks ({bankListToUse.length})</span>
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
          Database-seeded canonical Nepalese commercial banks supported by the automated SMS tracking parser.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {bankListToUse.map((b, idx) => {
            const presetMatch = defaultSupportedBanks.find(p => p.name.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(p.name.toLowerCase()));
            const mask = b.account_mask || (presetMatch ? presetMatch.mask : '*1234');
            return (
              <div
                key={b.id || b.name || idx}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Landmark size={16} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.name}
                  </strong>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    Default Mask: <code style={{ background: 'var(--bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{mask}</code>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Balance Transfer / Archive Portal Modal */}
      {transferModal.isOpen && transferModal.account && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          width: '100vw', height: '100vh', zIndex: 99999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '12px', padding: '24px', maxWidth: '460px', width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Archive size={22} color="var(--color-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Archive Bank Account
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              <strong>{transferModal.account.bankName}</strong> has a remaining balance of <strong style={{ color: 'var(--color-primary)' }}>Rs. {transferModal.account.balance.toLocaleString()}</strong>. Select how to handle remaining funds:
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Archiving Action &amp; Balance Handling
              </label>
              <CustomDropdown
                options={combinedArchiveOptions}
                value={transferModal.targetAccountId}
                onChange={(val) => setTransferModal({ ...transferModal, targetAccountId: val })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setTransferModal({ isOpen: false, account: null, targetAccountId: 'cash' })}
                style={{
                  background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
                  padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransferModal}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Confirm &amp; Archive
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
