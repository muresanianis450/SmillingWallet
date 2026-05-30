import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { BlobBackground } from '../../shared/BlobBackground';
// @ts-ignore
import styles from '../Login/LoginPage.module.css';

interface Props { setPage: (page: any) => void; }

export function ActivateAccountPage({ setPage }: Props) {
    const [token, setToken]       = useState('');
    const [tokenValid, setTokenValid] = useState<boolean | null>(null); // null = checking
    const [tokenError, setTokenError] = useState('');

    const [password, setPassword] = useState('');
    const [confirm,  setConfirm]  = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmError,  setConfirmError]  = useState('');

    const [done,    setDone]    = useState(false);
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Extract token from URL and verify it immediately
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (!t) {
            setTokenValid(false);
            setTokenError('No invitation token found in the link. Please contact the administrator.');
            return;
        }
        setToken(t);

        api.get(`/auth/invite/verify?token=${t}`)
            .then(() => setTokenValid(true))
            .catch((e) => {
                setTokenValid(false);
                setTokenError(
                    e.response?.data?.message ||
                    'This invitation link is invalid or has already expired. Please contact the administrator.'
                );
            });
    }, []);

    function validatePassword(val: string): string {
        if (val.length < 8)       return 'Password must be at least 8 characters';
        if (!/\d/.test(val))      return 'Must contain at least 1 digit';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val))
            return 'Must contain at least 1 special character';
        return '';
    }

    async function handleSubmit() {
        const pwErr = validatePassword(password);
        if (pwErr) { setPasswordError(pwErr); return; }
        if (password !== confirm) { setConfirmError('Passwords do not match.'); return; }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/activate', { token, newPassword: password });
            setDone(true);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Activation failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    }

    // ── Checking token ────────────────────────────────────────────────────────
    if (tokenValid === null) {
        return (
            <div className={styles.wrap}>
                <BlobBackground />
                <div className={styles.card}>
                    <h2 className={styles.title}>Verifying invitation…</h2>
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>Please wait a moment.</p>
                </div>
            </div>
        );
    }

    // ── Invalid token ─────────────────────────────────────────────────────────
    if (!tokenValid) {
        return (
            <div className={styles.wrap}>
                <BlobBackground />
                <div className={styles.card}>
                    <h2 className={styles.title}>Invalid Link</h2>
                    <p className={styles.errorMsg} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        {tokenError}
                    </p>
                    <button className={styles.submitBtn} onClick={() => setPage('login')}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            <BlobBackground />
            <div className={styles.card}>
                <h2 className={styles.title}>Activate Your Account</h2>

                {done ? (
                    <>
                        <p style={{ textAlign: 'center', color: '#27ae60', marginBottom: '0.5rem' }}>
                            🎉 Account activated successfully!
                        </p>
                        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
                            You can now log in with your email and new password.
                        </p>
                        <button className={styles.submitBtn} onClick={() => setPage('login')}>
                            Go to Login
                        </button>
                    </>
                ) : (
                    <>
                        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
                            Choose a password to activate your Smiling Wallet dentist account.
                        </p>

                        {error && (
                            <p className={styles.errorMsg} style={{ marginBottom: '1rem' }}>
                                {error}
                            </p>
                        )}

                        {/* New Password */}
                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>Password</label>
                                <button
                                    className={styles.hideBtn}
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                >
                                    {showPassword ? 'Hide' : '👁 Show'}
                                </button>
                            </div>
                            <input
                                className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                                placeholder="Min 8 chars, 1 digit, 1 special"
                                autoFocus
                            />
                            {passwordError && <p className={styles.errorMsg}>{passwordError}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>Confirm Password</label>
                                <button
                                    className={styles.hideBtn}
                                    type="button"
                                    onClick={() => setShowConfirm(p => !p)}
                                >
                                    {showConfirm ? 'Hide' : '👁 Show'}
                                </button>
                            </div>
                            <input
                                className={`${styles.input} ${confirmError ? styles.inputError : ''}`}
                                type={showConfirm ? 'text' : 'password'}
                                value={confirm}
                                onChange={e => { setConfirm(e.target.value); setConfirmError(''); }}
                                placeholder="Repeat your password"
                            />
                            {confirmError && <p className={styles.errorMsg}>{confirmError}</p>}
                        </div>

                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={loading || !password || !confirm}
                        >
                            {loading ? 'Activating…' : 'Activate Account'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
