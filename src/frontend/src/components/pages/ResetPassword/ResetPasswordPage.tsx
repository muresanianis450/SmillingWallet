import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { BlobBackground } from '../../shared/BlobBackground';
import { Icon } from '../../shared/Icon';
// @ts-ignore
import styles from '../Login/LoginPage.module.css';

interface Props { setPage: (page: any) => void; }

export function ResetPasswordPage({ setPage }: Props) {
    const [token, setToken]           = useState('');
    const [password, setPassword]     = useState('');
    const [confirm, setConfirm]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError]   = useState('');
    const [done, setDone]             = useState(false);
    const [error, setError]           = useState('');
    const [loading, setLoading]       = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) setToken(t);
        else setError('Invalid or missing reset token.');
    }, []);

    function validatePassword(val: string): string {
        if (val.length < 8)
            return 'Password must be at least 8 characters';
        if (!/\d/.test(val))
            return 'Must contain at least 1 digit';
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
            await api.post('/auth/reset-password', { token, newPassword: password });
            setDone(true);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.wrap}>
            <BlobBackground />
            <div className={styles.card}>
                <h2 className={styles.title}>Set New Password</h2>

                {done ? (
                    <>
                        <p style={{ textAlign: 'center', color: '#27ae60', marginBottom: '1.5rem' }}>
                            Password updated! You can now log in with your new password.
                        </p>
                        <button className={styles.submitBtn} onClick={() => setPage('login')}>
                            Go to Login
                        </button>
                    </>
                ) : (
                    <>
                        {error && (
                            <p className={styles.errorMsg} style={{ marginBottom: '1rem' }}>
                                {error}
                            </p>
                        )}

                        {/* New Password */}
                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>New Password</label>
                                <button
                                    className={styles.hideBtn}
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                >
                                    {showPassword ? <><Icon name="eye-off" size={14} /> Hide</> : <><Icon name="eye" size={14} /> Show</>}
                                </button>
                            </div>
                            <input
                                className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                                placeholder="Min 8 chars, 1 digit, 1 special"
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
                                    {showConfirm ? <><Icon name="eye-off" size={14} /> Hide</> : <><Icon name="eye" size={14} /> Show</>}
                                </button>
                            </div>
                            <input
                                className={`${styles.input} ${confirmError ? styles.inputError : ''}`}
                                type={showConfirm ? 'text' : 'password'}
                                value={confirm}
                                onChange={e => { setConfirm(e.target.value); setConfirmError(''); }}
                                placeholder="Repeat your new password"
                            />
                            {confirmError && <p className={styles.errorMsg}>{confirmError}</p>}
                        </div>

                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={loading || !password || !confirm}
                        >
                            {loading ? 'Saving…' : 'Reset Password'}
                        </button>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button className={styles.link} onClick={() => setPage('login')}>
                        ← Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}