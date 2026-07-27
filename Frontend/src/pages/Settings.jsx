import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Landmark, Trash2, PlusCircle, Check, LogOut, Smile } from 'lucide-react';
import { accountsApi } from '../services/api';
import { useDialog } from '../context/DialogContext';

export default function Settings({
  colorTheme,
  setColorTheme,
  categories,
  setCategories,
  trackedAccounts = [],
  setTrackedAccounts,
  onDataRefresh,
  onLogout,
  user
}) {
  const { showConfirm, showAlert } = useDialog();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [showNewPicker, setShowNewPicker] = useState(false);
  const [activeEditingCat, setActiveEditingCat] = useState(null);

  const [bankName, setBankName] = useState('');
  const [accountMask, setAccountMask] = useState('');
  const [bankBalance, setBankBalance] = useState('');

  const swatches = [
    { id: 'mint', label: 'Mint Fresh', color: '#10b981' },
    { id: 'ocean', label: 'Ocean Breeze', color: '#3b82f6' },
    { id: 'sunset', label: 'Sunset Glow', color: '#f97316' },
    { id: 'sakura', label: 'Sakura Petal', color: '#ec4899' },
    { id: 'slate', label: 'Minimalist Slate', color: '#64748b' }
  ];

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      await showAlert('Category with this name already exists.', { type: 'warning', title: 'Duplicate Category' });
      return;
    }

    const newCat = {
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '📁',
      color: newCatColor
    };

    setCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatIcon('📁');
    setNewCatColor('#10b981');
    setShowNewPicker(false);
  };

  const [accError, setAccError] = useState('');

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!bankName.trim() || !bankBalance) return;
    setAccError('');
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
      setAccError(err.message);
    }
  };

  const handleDeleteAccount = async (id) => {
    const confirmed = await showConfirm(
      'Stop tracking this bank account? Historical transaction links will remain.',
      { title: 'Remove Bank Account', type: 'error', confirmLabel: 'Remove Account', cancelLabel: 'Cancel' }
    );
    if (!confirmed) return;
    try {
      await accountsApi.remove(id);
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      await showAlert(`Delete failed: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {user && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
          <div>
            <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>{user.profile_name || user.email}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
          {onLogout && (
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              <LogOut size={14} /> Logout
            </button>
          )}
        </div>
      )}

      <div>
        <h2 style={{ fontWeight: '700', fontSize: '20px', marginBottom: '6px' }}>⚙️ Personalization &amp; Themes</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
          Configure BachatGara's interface accents. Select your favorite Spendee-inspired color palette:
        </p>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Interface Accent Color</h4>
          <div className="theme-palette-grid">
            {swatches.map(s => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div
                  className={`theme-swatch ${colorTheme === s.id ? 'active' : ''}`}
                  style={{ backgroundColor: s.color }}
                  onClick={() => setColorTheme(s.id)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🏦 Tracked Bank Accounts Management */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h3 style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={20} className="md-primary" />
          <span>Tracked Bank Accounts &amp; SMS Masks</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Register bank accounts with their exact SMS pattern label (e.g. <code>*1234</code>, <code>0#15</code>) so incoming SMS logs match correctly.
        </p>

        {/* Bank List Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {trackedAccounts.map(acc => (
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

        {/* Add Bank Form */}
        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={16} className="md-primary" />
            <span>Add Bank Account to Track</span>
          </h4>
          <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>Bank Name</label>
              <input
                type="text"
                placeholder="e.g. NMB Bank"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                required
              />
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
              <button type="submit" className="btn-primary" style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Check size={16} />
                <span>Track Bank</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 📁 Category Customizer Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h4 style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>📁 Dynamic Category Customizer</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Change the color or emoji icon for existing categories, or add your own custom categories using the interactive emoji picker.
        </p>

        {/* Existing Categories Editor */}
        <div className="category-customizer-grid">
          {categories.map(cat => (
            <div key={cat.name} className="category-edit-card" style={{ position: 'relative' }}>
              <div className="category-edit-info">
                <button
                  type="button"
                  className="category-icon-picker"
                  onClick={() => setActiveEditingCat(activeEditingCat === cat.name ? null : cat.name)}
                  title="Click to edit emoji"
                >
                  {cat.icon}
                </button>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{cat.name}</span>
              </div>
              <input
                type="color"
                value={cat.color}
                className="category-color-picker"
                onChange={e => {
                  setCategories(categories.map(c => c.name === cat.name ? { ...c, color: e.target.value } : c));
                }}
                title="Choose category color"
              />

              {activeEditingCat === cat.name && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 99999,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                  <div style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column'
                  }} className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--bg-accent)', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Select Emoji for "{cat.name}"</span>
                      <button
                        type="button"
                        onClick={() => setActiveEditingCat(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setCategories(categories.map(c => c.name === cat.name ? { ...c, icon: emojiData.emoji } : c));
                        setActiveEditingCat(null);
                      }}
                      width={320}
                      height={380}
                      theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Custom Category Form */}
        <div style={{ marginTop: '24px', background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', position: 'relative' }}>
          <h5 style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '10px' }}>🆕 Add Custom Category</h5>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Category Name"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }}
              required
            />
            
            <div>
              <button
                type="button"
                onClick={() => setShowNewPicker(!showNewPicker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 12px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '15px'
                }}
                title="Select Emoji"
              >
                <span>{newCatIcon}</span>
                <Smile size={16} color="var(--text-muted)" />
              </button>

              {showNewPicker && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 99999,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                  <div style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column'
                  }} className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--bg-accent)', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Select Emoji Icon</span>
                      <button
                        type="button"
                        onClick={() => setShowNewPicker(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewCatIcon(emojiData.emoji);
                        setShowNewPicker(false);
                      }}
                      width={320}
                      height={380}
                      theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Color:</span>
              <input
                type="color"
                value={newCatColor}
                onChange={e => setNewCatColor(e.target.value)}
                style={{ width: '40px', height: '36px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Add Category
            </button>
          </form>
        </div>
      </div>

      {/* Gateway Service Status */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>Nepalese Bank SMS Sync Gateway</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          When active, the Android gateway forwards whitelisted parsed SMS alerts automatically to your web resolution queue.
        </p>
        <div style={{ padding: '14px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '14px' }}>Automatic Sync Service Status</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Connected Gateway Device: Android Emulator (Pixel 6)</div>
          </div>
          <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>● Gateway Online</span>
        </div>
      </div>
    </div>
  );
}
