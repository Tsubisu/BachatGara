import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

const DialogContext = createContext();

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message, titleOrOpts = 'Notification', opts = {}) => {
    let title = 'Notification';
    let type = 'info';
    if (typeof titleOrOpts === 'object' && titleOrOpts !== null) {
      type = titleOrOpts.type || 'info';
      title = titleOrOpts.title || 'Notification';
    } else {
      title = titleOrOpts || 'Notification';
      type = typeof opts === 'string' ? opts : (opts?.type || 'info');
    }

    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        confirmLabel: 'OK',
        cancelLabel: '',
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const showConfirm = (message, titleOrOpts = 'Confirmation', opts = {}) => {
    let title = 'Confirmation';
    let options = {};
    if (typeof titleOrOpts === 'object' && titleOrOpts !== null) {
      options = titleOrOpts;
      title = options.title || 'Confirmation';
    } else {
      title = titleOrOpts || 'Confirmation';
      options = opts || {};
    }
    const confirmLabel = options.confirmLabel || 'Confirm';
    const cancelLabel = options.cancelLabel || 'Cancel';
    const type = options.type || 'warning';

    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        confirmLabel,
        cancelLabel,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const closeDialog = () => {
    if (dialogState.onCancel) dialogState.onCancel();
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      {children}
      {dialogState.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                padding: '10px',
                borderRadius: '50%',
                background: dialogState.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                            dialogState.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                            dialogState.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                            'rgba(59, 130, 246, 0.1)',
                color: dialogState.type === 'error' ? '#ef4444' :
                       dialogState.type === 'success' ? '#10b981' :
                       dialogState.type === 'warning' ? '#f59e0b' :
                       '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {dialogState.type === 'error' && <AlertTriangle size={24} />}
                {dialogState.type === 'success' && <CheckCircle2 size={24} />}
                {dialogState.type === 'warning' && <HelpCircle size={24} />}
                {dialogState.type === 'info' && <Info size={24} />}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {dialogState.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {dialogState.message}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              {dialogState.cancelLabel && (
                <button
                  type="button"
                  onClick={() => {
                    if (dialogState.onCancel) dialogState.onCancel();
                  }}
                  className="btn-primary"
                  style={{
                    background: 'var(--bg-accent)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    padding: '8px 16px',
                    fontSize: '13px',
                  }}
                >
                  {dialogState.cancelLabel}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (dialogState.onConfirm) dialogState.onConfirm();
                }}
                className="btn-primary"
                style={{
                  background: dialogState.type === 'error' ? '#ef4444' :
                              dialogState.type === 'warning' ? '#f59e0b' :
                              'var(--color-primary)',
                  padding: '8px 20px',
                  fontSize: '13px',
                }}
              >
                {dialogState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}