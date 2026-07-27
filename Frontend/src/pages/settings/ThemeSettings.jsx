import React from 'react';

export default function ThemeSettings({ colorTheme, setColorTheme }) {
  const swatches = [
    { id: 'mint', label: 'Mint Fresh', color: '#10b981' },
    { id: 'ocean', label: 'Ocean Breeze', color: '#3b82f6' },
    { id: 'sunset', label: 'Sunset Glow', color: '#f97316' },
    { id: 'sakura', label: 'Sakura Petal', color: '#ec4899' },
    { id: 'slate', label: 'Minimalist Slate', color: '#64748b' }
  ];

  return (
    <div>
      <h2 style={{ fontWeight: '700', fontSize: '20px', marginBottom: '6px' }}>⚙️ Personalization &amp; Themes</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
        Configure BachatGara's interface accents. Select your favorite Spendee-inspired color palette:
      </p>

      <div>
        <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>Interface Accent Color</h4>
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
  );
}
