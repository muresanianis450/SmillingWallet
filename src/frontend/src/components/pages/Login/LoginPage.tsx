import {useState} from 'react';
import {AuthUser, PageName} from '../../../types/types';
import {BlobBackground} from '../../shared/BlobBackground';
import {Icon} from '../../shared/Icon';
import styles from './LoginPage.module.css';
import {api} from '../../../services/api';
import {useGoogleAuth} from '../../../hooks/useGoogleAuth';

interface LoginPageProps {
    setPage: (page: PageName) => void;
    onLogin: (user: AuthUser) => void;
}

export function LoginPage({ setPage, onLogin }: LoginPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe]     = useState(false);
    const [password, setPassword]         = useState('');
    const [passwordError, setPasswordError] = useState('');

    // MFA second step state
    const [mfaStep, setMfaStep]       = useState(false);
    const [mfaType, setMfaType]       = useState<'totp' | 'email'>('totp');
    const [tempToken, setTempToken]   = useState('');
    const [mfaCode, setMfaCode]       = useState('');
    const [useBackup, setUseBackup]   = useState(false);
    const [mfaError, setMfaError]     = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);

    // Google login reuses the same MFA screen when the account has 2FA enabled.
    const { signInWithGoogle, googleError, googleLoading } = useGoogleAuth(
        onLogin,
        (tt, type) => {
            setTempToken(tt);
            setMfaType(type);
            setMfaStep(true);
            setMfaCode('');
            setMfaError('');
            setUseBackup(false);
        },
    );

    function validatePassword(val: string): string {
        if (val.length < 8)            return 'Password must be at least 8 characters';
        if (!/\d/.test(val))           return 'Must contain at least 1 digit';
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val))
            return 'Must contain at least 1 special character';
        return '';
    }

    async function handleLogin() {
        const error = validatePassword(password);
        if (error) {
            setPasswordError(error);
            return;
        }

        try {
            const res = await api.post('/auth/login', {
                email: (document.getElementById("login-email") as HTMLInputElement).value,
                password
            });

            if (res.data.requiresMfa) {
                setTempToken(res.data.tempToken);
                setMfaType(res.data.mfaType === 'email' ? 'email' : 'totp');
                setMfaStep(true);
                setMfaCode('');
                setMfaError('');
                setUseBackup(false);
                return;
            }

            onLogin({
                id: res.data.user.id,
                username: res.data.user.username,
                role: res.data.user.role.toUpperCase(),
                token: res.data.token,
                refreshToken: res.data.refreshToken,
                profileCompletionPct: res.data.user.profileCompletionPct,
                missingFields: res.data.user.missingFields ?? [],
                profilePicture: res.data.user.profilePicture ?? null,
                twoFactorEnabled: res.data.user.twoFactorEnabled ?? false,
                emailRemindersEnabled: res.data.user.emailRemindersEnabled ?? true,
            });

        } catch (err: any) {
            setPasswordError(err.response?.data?.message || 'Login failed');
        }
    }

    async function handleMfaVerify(codeOverride?: string) {
        const code = codeOverride ?? mfaCode;
        if (!code.trim()) return;
        setMfaLoading(true);
        setMfaError('');
        try {
            const endpoint = mfaType === 'email' ? '/auth/email2fa/verify-login' : '/auth/2fa/verify';
            const res = await api.post(endpoint, { tempToken, code });
            onLogin({
                id: res.data.user.id,
                username: res.data.user.username,
                role: res.data.user.role.toUpperCase(),
                token: res.data.token,
                refreshToken: res.data.refreshToken,
                profileCompletionPct: res.data.user.profileCompletionPct,
                missingFields: res.data.user.missingFields ?? [],
                profilePicture: res.data.user.profilePicture ?? null,
                twoFactorEnabled: res.data.user.twoFactorEnabled ?? false,
                emailRemindersEnabled: res.data.user.emailRemindersEnabled ?? true,
            });
        } catch (err: any) {
            setMfaError(err.response?.data?.message || 'Invalid code — please try again');
        } finally {
            setMfaLoading(false);
        }
    }

    function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
        setMfaCode(raw);
        setMfaError('');
        if (raw.length === 6) handleMfaVerify(raw);
    }

    function handleBackupChange(e: React.ChangeEvent<HTMLInputElement>) {
        setMfaCode(e.target.value);
        setMfaError('');
    }

    // ── MFA screen ────────────────────────────────────────────────────────────
    if (mfaStep) {
        return (
            <div className={styles.wrap}>
                <BlobBackground />
                <div className={styles.card}>
                    <h2 className={styles.title}>Two-Factor Authentication</h2>

                    <p style={{ fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center' }}>
                        {useBackup
                            ? 'Enter one of your backup codes.'
                            : mfaType === 'email'
                                ? 'A 6-digit code was sent to your email address.'
                                : 'Enter the 6-digit code from your authenticator app.'}
                    </p>

                    <div className={styles.field}>
                        {useBackup ? (
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="XXXX-XXXX"
                                value={mfaCode}
                                onChange={handleBackupChange}
                                autoComplete="off"
                                style={{ letterSpacing: '0.15em', textAlign: 'center' }}
                            />
                        ) : (
                            <input
                                className={styles.input}
                                type="text"
                                inputMode="numeric"
                                placeholder="000000"
                                value={mfaCode}
                                onChange={handleOtpChange}
                                autoComplete="one-time-code"
                                maxLength={6}
                                style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 22 }}
                            />
                        )}
                        {mfaError && <p className={styles.errorMsg}>{mfaError}</p>}
                    </div>

                    {useBackup && (
                        <button
                            className={styles.submitBtn}
                            type="button"
                            onClick={() => handleMfaVerify()}
                            disabled={mfaLoading || !mfaCode.trim()}
                            style={{ marginBottom: 12 }}
                        >
                            {mfaLoading ? 'Verifying…' : 'Use backup code'}
                        </button>
                    )}

                    {mfaType === 'totp' && (
                        <button
                            className={styles.link}
                            type="button"
                            onClick={() => { setUseBackup(v => !v); setMfaCode(''); setMfaError(''); }}
                            style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 8 }}
                        >
                            {useBackup ? 'Use authenticator code instead' : 'Use a backup code instead'}
                        </button>
                    )}

                    <button
                        className={styles.link}
                        type="button"
                        onClick={() => { setMfaStep(false); setMfaCode(''); setMfaError(''); }}
                        style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 4, color: '#999' }}
                    >
                        ← Back to login
                    </button>
                </div>
            </div>
        );
    }

    // ── Password screen ───────────────────────────────────────────────────────
    return (
        <div className={styles.wrap}>
            <BlobBackground />
            <div className={styles.card}>

                <div className={styles.tabs}>
                    <button
                        className={styles.tab}
                        onClick={() => setPage('register')}
                        type="button"
                    >
                        Sign up
                    </button>
                    <button
                        className={`${styles.tab} ${styles.tabActive}`}
                        type="button"
                    >
                        Log in
                    </button>
                </div>

                <h2 className={styles.title}>Log in</h2>

                <div className={styles.socialButtons}>
                    <button className={styles.socialBtn} type="button" onClick={signInWithGoogle} disabled={googleLoading}>
                        <GoogleIcon /> {googleLoading ? 'Signing in…' : 'Continue with Google'}
                    </button>
                    <button className={styles.socialBtn} type="button">
                        <AppleIcon /> Continue with Apple
                    </button>
                </div>
                {googleError && <p className={styles.errorMsg} style={{ textAlign: 'center' }}>{googleError}</p>}

                <div className={styles.divider}><span>Or continue with email</span></div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="login-email">
                        Email address or username
                    </label>
                    <input
                        id="login-email"
                        className={styles.input}
                        type="text"
                        autoComplete="username"
                        inputMode="email"
                        placeholder=""
                    />
                </div>

                <div className={styles.field}>
                    <div className={styles.labelRow}>
                        <label className={styles.label} htmlFor="login-password">
                            Password
                        </label>
                        <button
                            className={styles.hideBtn}
                            onClick={() => setShowPassword(p => !p)}
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <><Icon name="eye-off" size={14} /> Hide</> : <><Icon name="eye" size={14} /> Show</>}
                        </button>
                    </div>
                    <input
                        id="login-password"
                        className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        autoComplete="current-password"
                        onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                        placeholder=""
                    />
                    {passwordError && <p className={styles.errorMsg}>{passwordError}</p>}
                    <div className={styles.forgotRow}>
                        <button className={styles.link} type="button" onClick={() => setPage('forgot-password')}>
                            Forgot your password?
                        </button>
                    </div>
                </div>

                <label className={styles.checkboxRow}>
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className={styles.checkbox}
                    />
                    Remember me
                </label>

                <button className={styles.submitBtn} type="button" onClick={handleLogin}>
                    Log in
                </button>

            </div>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
        </svg>
    );
}
