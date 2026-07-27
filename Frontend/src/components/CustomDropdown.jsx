import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Landmark } from 'lucide-react';
import { getLogoUrl } from '../utils/imageUtils';

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  style = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value || opt.name === value || opt.bankName === value);

  const getLogoSrc = (opt) => {
    if (!opt) return null;
    const url = opt.logo_url || opt.logoUrl;
    return getLogoUrl(url);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-sm)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {selectedOption ? (
            <>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selectedOption.type === 'cash' || selectedOption.value === 'Cash' || selectedOption.name === 'Cash' ? (
                  <span style={{ fontSize: '12px' }}>💵</span>
                ) : getLogoSrc(selectedOption) ? (
                  <img src={getLogoSrc(selectedOption)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Landmark size={14} color="var(--text-muted)" />
                )}
              </div>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedOption.label || selectedOption.name || selectedOption.bankName || value}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100000,
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            padding: '4px 0'
          }}
        >
          {options.map((opt, idx) => {
            const optVal = opt.value || opt.name || opt.bankName;
            const optLabel = opt.label || opt.name || opt.bankName;
            const isSelected = optVal === value;
            const logoSrc = getLogoSrc(opt);

            return (
              <div
                key={opt.id || optVal || idx}
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-accent)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: isSelected ? '700' : '500',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {opt.type === 'cash' || optVal === 'Cash' ? (
                    <span style={{ fontSize: '13px' }}>💵</span>
                  ) : logoSrc ? (
                    <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Landmark size={14} color="var(--text-muted)" />
                  )}
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {optLabel}
                  {opt.accountMask && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>({opt.accountMask})</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}