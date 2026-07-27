import React, { useState, useEffect, useCallback } from 'react';
import { gatewayApi } from '../../services/api';
import { Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const POLL_INTERVAL_MS = 30_000;

export default function GatewaySettings() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const data = await gatewayApi.status();
      setStatus(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const isOnline = status?.online === true;

  return (
    <div>
      <h4 style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Smartphone size={20} className="md-primary" />
        Nepalese Bank SMS Sync Gateway
      </h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
        When the BachatGara Android app is running on your gateway phone, it forwards parsed bank SMS alerts to your web resolution queue automatically. The status below reflects the live connection.
      </p>

      <div style={{
        padding: '20px',
        background: 'var(--bg-primary)',
        border: `1px solid ${loading ? 'var(--border-color)' : isOnline ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.3)'}`,
        borderRadius: 'var(--border-radius-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        transition: 'border-color 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

          <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: loading ? 'var(--bg-accent)' : isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {loading
                ? <RefreshCw size={16} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
                : isOnline
                  ? <Wifi size={16} style={{ color: '#10b981' }} />
                  : <WifiOff size={16} style={{ color: '#ef4444' }} />
              }
            </div>

            {!loading && isOnline && (
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid #10b981', opacity: 0.5,
                animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
              }} />
            )}
          </div>

          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
              {loading ? 'Checking gateway status…' : 'Automatic Sync Service Status'}
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
              {loading
                ? ''
                : status?.last_seen_ago
                  ? `Last heartbeat: ${status.last_seen_ago}`
                  : 'No Android device has connected yet'
              }
            </span>
            {error && (
              <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                ⚠️ {error}
              </span>
            )}
          </div>
        </div>

        {!loading && (
          <span style={{
            fontWeight: '700', fontSize: '12px', padding: '5px 14px',
            borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0,
            background: isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)',
            color: isOnline ? '#10b981' : '#ef4444',
            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            {isOnline ? '● Gateway Online' : '○ Gateway Offline'}
          </span>
        )}
      </div>

      {!loading && status?.message && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', fontStyle: 'italic' }}>
          {status.message}
        </p>
      )}

      {!loading && !isOnline && (
        <div style={{
          marginTop: '20px', padding: '16px 18px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-sm)', fontSize: '13px', color: 'var(--text-secondary)',
          lineHeight: '1.6',
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
            📱 How to connect the Android gateway app:
          </strong>
          <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Download and install the <strong>BachatGara Gateway</strong> Android APK.</li>
            <li>Log in with your BachatGara account — the app stores your JWT automatically.</li>
            <li>Grant SMS read permission when prompted.</li>
            <li>Keep the app running in the background. It will send a heartbeat every 30 seconds.</li>
            <li>The status above will turn <strong style={{ color: '#10b981' }}>green</strong> within 30 seconds of connecting.</li>
          </ol>
        </div>
      )}

      <button
        onClick={() => { setLoading(true); fetchStatus(); }}
        className="btn-primary"
        style={{ marginTop: '16px', padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
      >
        <RefreshCw size={13} />
        Refresh Status
      </button>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

