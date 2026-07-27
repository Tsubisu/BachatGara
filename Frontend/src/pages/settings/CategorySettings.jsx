import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { categoriesApi } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { Smile, Plus, Check } from 'lucide-react';

export default function CategorySettings({ categories = [], setCategories, onDataRefresh }) {
  const { showAlert, showConfirm } = useDialog();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [showNewPicker, setShowNewPicker] = useState(false);
  const [activeEditingCat, setActiveEditingCat] = useState(null);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      await showAlert('Category with this name already exists.', { type: 'warning', title: 'Duplicate Category' });
      return;
    }

    try {
      await categoriesApi.upsert({
        name: newCatName.trim(),
        icon: newCatIcon.trim() || '📁',
        color: newCatColor,
        type: 'expense'
      });

      setNewCatName('');
      setNewCatIcon('📁');
      setNewCatColor('#10b981');
      setShowNewPicker(false);

      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      await showAlert(`Failed to add category: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  const handleUpdateIcon = async (cat, selectedEmoji) => {
    try {
      await categoriesApi.upsert({
        name: cat.name,
        type: cat.type || 'expense',
        icon: selectedEmoji,
        color: cat.color
      });
      setActiveEditingCat(null);
      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      await showAlert(`Failed to save category icon: ${err.message}`, { type: 'error', title: 'Error' });
    }
  };

  return (
    <div>
      <h4 style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📁 Dynamic Category Customizer</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Change colors or pick custom emojis using the interactive emoji picker for system and custom categories.
      </p>

      <div className="category-customizer-grid">
        {categories.map(cat => (
          <div key={cat.name} className="category-edit-card" style={{ position: 'relative' }}>
            <div className="category-edit-info">
              <button
                type="button"
                className="category-icon-picker"
                onClick={() => setActiveEditingCat(activeEditingCat === cat.name ? null : cat.name)}
                title="Click to choose emoji"
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
                if (setCategories) {
                  setCategories(categories.map(c => c.name === cat.name ? { ...c, color: e.target.value } : c));
                }
              }}
              onBlur={async (e) => {
                try {
                  await categoriesApi.upsert({
                    name: cat.name,
                    type: cat.type || 'expense',
                    icon: cat.icon,
                    color: e.target.value
                  });
                  if (onDataRefresh) {
                    await onDataRefresh();
                  }
                } catch (err) {
                  await showAlert(`Failed to save category color: ${err.message}`, { type: 'error', title: 'Error' });
                }
              }}
              title="Choose category color"
            />

            {/* Centered Screen Emoji Picker Modal */}
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
                    onEmojiClick={(emojiData) => handleUpdateIcon(cat, emojiData.emoji)}
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
  );
}
