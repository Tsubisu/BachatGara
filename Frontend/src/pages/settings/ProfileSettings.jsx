import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Camera, Upload } from 'lucide-react';
import { profileApi, setUser } from '../../services/api';

export default function ProfileSettings({ user, onDataRefresh }) {
  const [profileName, setProfileName] = useState(user?.profile_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSecuritySensitive =
    email.trim().toLowerCase() !== (user?.email || '').toLowerCase() ||
    newPassword.length > 0;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image size must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isSecuritySensitive && !currentPassword) {
      setError('Current password is required to save changes to email or password.');
      setLoading(false);
      return;
    }

    if (newPassword.length > 0) {
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        profile_name: profileName.trim(),
        theme: user?.theme || 'dark',
        email: email.trim(),
        avatar_url: avatarUrl,
      };

      if (isSecuritySensitive) {
        payload.current_password = currentPassword;
      }
      if (newPassword.trim().length > 0) {
        payload.new_password = newPassword;
      }

      const res = await profileApi.update(payload);

      setUser({
        ...user,
        profile_name: res.profile_name,
        email: res.email,
        theme: res.theme,
        avatar_url: res.avatar_url,
      });

      setSuccess('Profile details and avatar updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontWeight: '700', fontSize: '20px', marginBottom: '6px' }}>👤 Personal Details</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
        Manage your profile avatar, personal details, contact email, and security password.
      </p>

      {error && (
        <div className="warning-banner dark-warning-banner animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '10px 14px',
          marginBottom: '1.5rem',
          color: 'var(--color-primary)',
          fontSize: '13px',
          fontWeight: '600'
        }} className="animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Avatar Data Stream Uploader */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        <div style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--color-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={36} color="var(--text-muted)" />
          )}
        </div>
        <div>
          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            User Avatar Profile Picture
          </strong>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Stored directly in PostgreSQL database as a Base64 data stream.
          </span>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', fontSize: '12px', fontWeight: '600',
            background: 'var(--bg-accent)', color: 'var(--text-primary)',
            border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)',
            cursor: 'pointer'
          }}>
            <Upload size={14} />
            <span>Upload New Avatar</span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Profile Name
          </label>
          <div style={{ position: 'relative' }}>
            <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="e.g. Subash Gurung"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              style={{ paddingLeft: '36px' }}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ paddingLeft: '36px' }}
              required
            />
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.25rem',
          marginTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={15} className="md-primary" />
            <span>Change Account Password</span>
          </h3>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Required for email/password updates"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '36px' }}
                required={isSecuritySensitive}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              New Password (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: 'fit-content', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>

      </form>
    </div>
  );
}
