import React, { useState } from 'react';
import { categoriesApi } from '../../services/api';

export default function CategorySettings({ categories = [], setCategories, onDataRefresh }) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('#10b981');

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      alert('Category already exists!');
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

      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      alert(`Failed to add category: ${err.message}`);
    }
  };

  return (
    <div>
      <h4 style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📁 Dynamic Category Customizer</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Change the color or emoji icon for existing categories, or add your own custom categories.
      </p>

      {/* Existing Categories Editor */}
      <div className="category-customizer-grid">
        {categories.map(cat => (
          <div key={cat.name} className="category-edit-card">
            <div className="category-edit-info">
              <button 
                type="button" 
                className="category-icon-picker"
                onClick={async () => {
                  const newIcon = prompt(`Enter a new emoji icon for "${cat.name}":`, cat.icon);
                  if (newIcon !== null) {
                    try {
                      await categoriesApi.upsert({
                        name: cat.name,
                        type: cat.type || 'expense',
                        icon: newIcon || '📁',
                        color: cat.color
                      });
                      if (onDataRefresh) {
                        await onDataRefresh();
                      }
                    } catch (err) {
                      alert(`Failed to save category icon: ${err.message}`);
                    }
                  }
                }}
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
                  alert(`Failed to save category color: ${err.message}`);
                }
              }}
              title="Choose category color"
            />
          </div>
        ))}
      </div>

      {/* Add Custom Category Form */}
      <div style={{ marginTop: '24px', background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
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
          <input 
            type="text" 
            placeholder="Emoji" 
            value={newCatIcon}
            onChange={e => setNewCatIcon(e.target.value)}
            style={{ width: '80px', padding: '8px 12px', fontSize: '13px', textAlign: 'center' }}
          />
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
