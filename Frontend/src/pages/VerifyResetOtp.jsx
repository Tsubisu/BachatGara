import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { ShieldCheck, Send, ArrowLeft, AlertCircle } from 'lucide-react';

export default function VerifyResetOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer <= 0) return;
    const intervalId = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timer]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.verifyResetOtp(email, code);
      setSuccess('Code verified successfully!');
      setTimeout(() => {
        navigate('/reset-password', { state: { email, code } });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.resendOtp(email, 'password_reset');
      setSuccess('A new password reset code has been sent.');
      setTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');

      const match = err.message?.match(/wait\s+(\d+)\s+second/i);
      if (match) {
        setTimer(parseInt(match[1], 10));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--color-primary)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '24px',
            color: 'white'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
            Verify Reset Code
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', padding: '0 1rem' }}>
            We've sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '10px 14px',
              marginBottom: '1.25rem',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '10px 14px',
              marginBottom: '1.25rem',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              <ShieldCheck size={15} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                Enter OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="0 0 0 0 0 0"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  padding: '12px',
                  textTransform: 'uppercase'
                }}
                required
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || code.length !== 6}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading || code.length !== 6 ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></span>
              ) : (
                <ShieldCheck size={16} />
              )}
              Verify Code
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleResend}
              disabled={timer > 0 || loading}
              style={{
                background: 'none',
                border: 'none',
                color: timer > 0 ? 'var(--text-muted)' : 'var(--color-primary)',
                fontWeight: '700',
                fontSize: '14px',
                cursor: timer > 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} />
              {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Verification Code'}
            </button>

            <button
              onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '0.25rem'
              }}
            >
              <ArrowLeft size={13} /> Back to Forgot Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
