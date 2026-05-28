import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { AuthUser, PageName } from '../../../types/types';
import { ROMANIAN_CITIES } from '../../../data/constants';
import { BlobBackground } from '../../shared/BlobBackground';
// @ts-ignore
import styles from './ProfilePage.module.css';

const PRESET_AVATARS = Array.from({ length: 10 }, (_, i) => `/avatars/avatar-${i + 1}.svg`);
const DEFAULT_AVATAR = '/avatars/avatar-default.svg';

const SPECIALTIES = [
    { value: 'GENERAL_DENTISTRY',   label: 'General Dentistry' },
    { value: 'IMPLANTS',            label: 'Implants' },
    { value: 'ORTHODONTICS',        label: 'Orthodontics' },
    { value: 'COSMETIC_DENTISTRY',  label: 'Cosmetic Dentistry' },
    { value: 'PEDIATRIC_DENTISTRY', label: 'Pediatric Dentistry' },
    { value: 'ORAL_SURGERY',        label: 'Oral Surgery' },
    { value: 'PERIODONTICS',        label: 'Periodontics' },
    { value: 'ENDODONTICS',         label: 'Endodontics' },
];

interface ProfileData {
    id: string;
    username: string;
    phone: string;
    role: string;
    city: string;
    address: string;
    specialty: string | null;
    rating: number | null;
    profileCompletionPct: number;
    missingFields: string[];
    profilePicture: string | null;
    twoFactorEnabled: boolean;
    emailRemindersEnabled: boolean;
}

interface ProfilePageProps {
    user: AuthUser;
    setPage: (page: PageName) => void;
    focusField?: string | null;
    onProfileUpdate?: (pct: number, missingFields: string[], profilePicture?: string | null, twoFactorEnabled?: boolean, emailRemindersEnabled?: boolean) => void;
    onLogout?: () => void;
}

export function ProfilePage({ user, focusField, onProfileUpdate, onLogout }: ProfilePageProps) {
    const [profile, setProfile]               = useState<ProfileData | null>(null);
    const [username, setUsername]             = useState('');
    const [phone, setPhone]                   = useState('');
    const [city, setCity]                     = useState('');
    const [address, setAddress]               = useState('');
    const [specialty, setSpecialty]           = useState('');
    const [avatar, setAvatar]                 = useState<string | null>(null);
    const [twoFactor, setTwoFactor]           = useState(false);
    const [emailReminders, setEmailReminders] = useState(true);
    const [saving, setSaving]                 = useState(false);
    const [saved, setSaved]                   = useState(false);
    const [error, setError]                   = useState('');
    const [pickerOpen, setPickerOpen]         = useState(false);

    // ── 2FA wizard state ──────────────────────────────────────────────────────
    const [wizardOpen, setWizardOpen]         = useState(false);
    const [wizardStep, setWizardStep]         = useState<1|2|3>(1);
    const [wizardQrCode, setWizardQrCode]     = useState('');
    const [wizardSecret, setWizardSecret]     = useState('');
    const [wizardCodes, setWizardCodes]       = useState<string[]>([]);
    const [wizardCode, setWizardCode]         = useState('');
    const [wizardError, setWizardError]       = useState('');
    const [wizardLoading, setWizardLoading]   = useState(false);
    const [codesConfirmed, setCodesConfirmed] = useState(false);
    const [codesCopied, setCodesCopied]       = useState(false);

    // ── Danger zone state ─────────────────────────────────────────────────────
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleting, setDeleting]                   = useState(false);
    const [deleteError, setDeleteError]             = useState('');

    // ── Disable 2FA modal state ───────────────────────────────────────────────
    const [disableOpen, setDisableOpen]       = useState(false);
    const [disableCode, setDisableCode]       = useState('');
    const [disableError, setDisableError]     = useState('');
    const [disableLoading, setDisableLoading] = useState(false);

    const usernameRef  = useRef<HTMLInputElement>(null);
    const phoneRef     = useRef<HTMLInputElement>(null);
    const cityRef      = useRef<HTMLSelectElement>(null);
    const specialtyRef = useRef<HTMLSelectElement>(null);

    const fieldRefs: Record<string, React.RefObject<any>> = {
        username: usernameRef,
        phone:    phoneRef,
        city:     cityRef,
        specialty: specialtyRef,
    };

    useEffect(() => {
        if (!user?.id) return;
        api.get(`/auth/user/${user.id}`).then(res => {
            const data: ProfileData = res.data;
            setProfile(data);
            setUsername(data.username || '');
            setPhone(data.phone || '');
            setCity(data.city || '');
            setAddress(data.address || '');
            setSpecialty(data.specialty || '');
            setAvatar(data.profilePicture || null);
            setTwoFactor(data.twoFactorEnabled ?? false);
            setEmailReminders(data.emailRemindersEnabled ?? true);
        });
    }, [user?.id]);

    useEffect(() => {
        if (!focusField || !profile) return;
        const ref = fieldRefs[focusField];
        if (ref?.current) {
            setTimeout(() => {
                ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ref.current.focus();
            }, 150);
        }
    }, [focusField, profile]);

    // ── Avatar ────────────────────────────────────────────────────────────────

    async function selectAvatar(src: string) {
        setAvatar(src);
        setPickerOpen(false);
        if (!username || !phone) return;
        try {
            const body: Record<string, any> = {
                username, phone, city, address,
                profilePicture: src,
                emailRemindersEnabled: emailReminders,
            };
            if (user.role === 'DENTIST' && specialty) body.specialty = specialty;
            const res = await api.put(`/auth/user/${user.id}`, body);
            const updated: ProfileData = res.data;
            setProfile(updated);
            onProfileUpdate?.(
                updated.profileCompletionPct,
                updated.missingFields,
                updated.profilePicture,
                updated.twoFactorEnabled,
                updated.emailRemindersEnabled,
            );
        } catch {
            // non-critical — avatar set in state; full save via Save Profile
        }
    }

    // ── Profile save ──────────────────────────────────────────────────────────

    async function handleSave() {
        setSaving(true);
        setError('');
        try {
            const body: Record<string, any> = {
                username,
                phone,
                city,
                address,
                profilePicture: avatar,
                emailRemindersEnabled: emailReminders,
            };
            if (user.role === 'DENTIST' && specialty) body.specialty = specialty;
            const res = await api.put(`/auth/user/${user.id}`, body);
            const updated: ProfileData = res.data;
            setProfile(updated);
            setUsername(updated.username || '');
            setPhone(updated.phone || '');
            setCity(updated.city || '');
            setAddress(updated.address || '');
            setSpecialty(updated.specialty || '');
            setAvatar(updated.profilePicture || null);
            setEmailReminders(updated.emailRemindersEnabled ?? true);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            onProfileUpdate?.(
                updated.profileCompletionPct,
                updated.missingFields,
                updated.profilePicture,
                updated.twoFactorEnabled,
                updated.emailRemindersEnabled,
            );
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    }

    // ── 2FA toggle handler ────────────────────────────────────────────────────

    function handleTwoFactorToggle(checked: boolean) {
        if (checked && !twoFactor) {
            startSetupWizard();
        } else if (!checked && twoFactor) {
            setDisableOpen(true);
            setDisableCode('');
            setDisableError('');
        }
    }

    async function startSetupWizard() {
        setWizardLoading(true);
        try {
            const res = await api.post('/auth/2fa/setup');
            setWizardQrCode(res.data.qrCodeUri);
            setWizardSecret(res.data.secret);
            setWizardCodes(res.data.backupCodes);
            setWizardStep(1);
            setWizardCode('');
            setWizardError('');
            setCodesConfirmed(false);
            setCodesCopied(false);
            setWizardOpen(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start 2FA setup');
        } finally {
            setWizardLoading(false);
        }
    }

    async function handleWizardConfirm() {
        if (!wizardCode.trim()) return;
        setWizardLoading(true);
        setWizardError('');
        try {
            await api.post('/auth/2fa/confirm', { code: wizardCode });
            setWizardStep(3);
        } catch (err: any) {
            setWizardError(err.response?.data?.message || 'Invalid code — please try again');
        } finally {
            setWizardLoading(false);
        }
    }

    function completeSetup() {
        setTwoFactor(true);
        setProfile(prev => prev ? { ...prev, twoFactorEnabled: true } : prev);
        setWizardOpen(false);
        onProfileUpdate?.(
            profile?.profileCompletionPct ?? 0,
            profile?.missingFields ?? [],
            avatar,
            true,
            emailReminders,
        );
    }

    function handleCopyCodes() {
        navigator.clipboard.writeText(wizardCodes.join('\n')).then(() => {
            setCodesCopied(true);
            setTimeout(() => setCodesCopied(false), 2000);
        });
    }

    function handleDownloadCodes() {
        const content = `SmilingWallet 2FA Backup Codes\n\n${wizardCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nStore these codes safely. Each code can only be used once.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'smilingwallet-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleDisable2fa() {
        if (!disableCode.trim()) return;
        setDisableLoading(true);
        setDisableError('');
        try {
            await api.post('/auth/2fa/disable', { code: disableCode });
            setTwoFactor(false);
            setProfile(prev => prev ? { ...prev, twoFactorEnabled: false } : prev);
            setDisableOpen(false);
            onProfileUpdate?.(
                profile?.profileCompletionPct ?? 0,
                profile?.missingFields ?? [],
                avatar,
                false,
                emailReminders,
            );
        } catch (err: any) {
            setDisableError(err.response?.data?.message || 'Invalid code');
        } finally {
            setDisableLoading(false);
        }
    }

    // ── Account actions ───────────────────────────────────────────────────────

    async function handleDeleteAccount() {
        setDeleting(true);
        setDeleteError('');
        try {
            await api.delete(`/auth/user/${user.id}`);
            onLogout?.();
        } catch (err: any) {
            setDeleteError(err.response?.data?.message || 'Failed to delete account');
            setDeleting(false);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (!profile) {
        return (
            <div className={styles.pageWrap}>
                <BlobBackground />
                <div className={styles.page}><p className={styles.loading}>Loading profile…</p></div>
            </div>
        );
    }

    const missing   = new Set(profile.missingFields || []);
    const pct       = profile.profileCompletionPct ?? 0;
    const isDentist = user.role === 'DENTIST';
    const avatarSrc = avatar || DEFAULT_AVATAR;

    return (
        <div className={styles.pageWrap}>
        <BlobBackground />
        <div className={styles.page}>
            <h1 className={styles.title}>My Profile</h1>

            {/* ── Avatar ── */}
            <div className={styles.avatarSection}>
                <button
                    type="button"
                    className={styles.avatarWrapper}
                    onClick={() => setPickerOpen(true)}
                    title="Change avatar"
                >
                    <img src={avatarSrc} alt="Profile" className={styles.avatar} />
                    <div className={styles.avatarOverlay}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </div>
                </button>
                <div className={styles.avatarInfo}>
                    <div className={styles.avatarName}>
                        {username || user.username}
                        {twoFactor && (
                            <span className={styles.mfaBadge}>2FA enabled</span>
                        )}
                    </div>
                    <div className={styles.avatarRole}>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</div>
                </div>
            </div>

            {/* ── Avatar picker modal ── */}
            {pickerOpen && (
                <div className={styles.pickerOverlay} onClick={() => setPickerOpen(false)}>
                    <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
                        <p className={styles.pickerTitle}>Choose your avatar</p>
                        <div className={styles.pickerGrid}>
                            {PRESET_AVATARS.map(src => (
                                <button
                                    key={src}
                                    type="button"
                                    className={`${styles.pickerItem} ${avatar === src ? styles.pickerItemActive : ''}`}
                                    onClick={() => selectAvatar(src)}
                                >
                                    <img src={src} alt="" className={styles.pickerItemImg} />
                                </button>
                            ))}
                        </div>
                        <button type="button" className={styles.pickerClose} onClick={() => setPickerOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Progress bar ── */}
            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>Profile completion</span>
                    <span className={styles.progressPct}>{pct}%</span>
                </div>
                <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                {pct < 100 && (
                    <p className={styles.progressHint}>
                        Missing: {(profile.missingFields || []).map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}
                    </p>
                )}
                {pct === 100 && (
                    <p className={styles.progressComplete}>Your profile is complete!</p>
                )}
            </div>

            {/* ── Form ── */}
            <div className={styles.form}>

                <div className={`${styles.field} ${missing.has('username') ? styles.fieldRequired : ''}`}>
                    <label className={styles.label}>Username</label>
                    <input
                        ref={usernameRef}
                        className={`${styles.input} ${missing.has('username') ? styles.inputMissing : ''}`}
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    {missing.has('username') && (
                        <p className={styles.hint}>Required to submit requests</p>
                    )}
                </div>

                <div className={`${styles.field} ${missing.has('phone') ? styles.fieldRequired : ''}`}>
                    <label className={styles.label}>Phone</label>
                    <input
                        ref={phoneRef}
                        className={`${styles.input} ${missing.has('phone') ? styles.inputMissing : ''}`}
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+40 7xx xxx xxx"
                    />
                    {missing.has('phone') && (
                        <p className={styles.hint}>Required to submit requests</p>
                    )}
                </div>

                <div className={`${styles.field} ${missing.has('city') ? styles.fieldRequired : ''}`}>
                    <label className={styles.label}>City</label>
                    <select
                        ref={cityRef}
                        className={`${styles.select} ${missing.has('city') ? styles.inputMissing : ''}`}
                        value={city}
                        onChange={e => setCity(e.target.value)}
                    >
                        <option value="">— select city —</option>
                        {ROMANIAN_CITIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {missing.has('city') && (
                        <p className={styles.hint}>Required to submit requests</p>
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        Address <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                        className={styles.input}
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Street, number…"
                    />
                </div>

                {isDentist && (
                    <div className={`${styles.field} ${missing.has('specialty') ? styles.fieldRequired : ''}`}>
                        <label className={styles.label}>Specialty</label>
                        <select
                            ref={specialtyRef}
                            className={`${styles.select} ${missing.has('specialty') ? styles.inputMissing : ''}`}
                            value={specialty}
                            onChange={e => setSpecialty(e.target.value)}
                        >
                            <option value="">— select specialty —</option>
                            {SPECIALTIES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        {missing.has('specialty') && (
                            <p className={styles.hint}>Required to send offers</p>
                        )}
                    </div>
                )}

                {/* ── Account Settings ── */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsTitle}>Account settings</div>

                    <div className={styles.settingRow}>
                        <div className={styles.settingInfo}>
                            <span className={styles.settingLabel}>
                                Two-Factor Authentication
                            </span>
                            <span className={styles.settingDesc}>
                                {twoFactor
                                    ? 'Enabled — your account is protected with TOTP'
                                    : 'Add a second verification step at login'}
                            </span>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={twoFactor}
                                onChange={e => handleTwoFactorToggle(e.target.checked)}
                                disabled={wizardLoading}
                            />
                            <span className={styles.toggleSlider} />
                        </label>
                    </div>

                    <div className={styles.settingRow}>
                        <div className={styles.settingInfo}>
                            <span className={styles.settingLabel}>
                                Email Reminders
                            </span>
                            <span className={styles.settingDesc}>Receive reminders for appointments and new offers</span>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={emailReminders}
                                onChange={e => setEmailReminders(e.target.checked)}
                            />
                            <span className={styles.toggleSlider} />
                        </label>
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                    type="button"
                >
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
                </button>

                {/* ── Danger zone ── */}
                <div className={styles.dangerSection}>
                    <div className={styles.settingsTitle}>Account</div>
                    <div className={styles.dangerRow}>
                        <button
                            type="button"
                            className={styles.logoutBtn}
                            onClick={onLogout}
                        >
                            Log out
                        </button>
                        <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => { setDeleteConfirmOpen(true); setDeleteError(''); }}
                        >
                            Delete account
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* ── 2FA Setup Wizard ── */}
        {wizardOpen && (
            <div className={styles.pickerOverlay} onClick={() => {}}>
                <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>

                    {/* Step indicator */}
                    <div className={styles.wizardSteps}>
                        {[1, 2, 3].map(n => (
                            <div
                                key={n}
                                className={`${styles.wizardDot} ${wizardStep >= n ? styles.wizardDotActive : ''}`}
                            />
                        ))}
                    </div>

                    {wizardStep === 1 && (
                        <>
                            <p className={styles.wizardTitle}>Scan the QR code</p>
                            <p className={styles.wizardDesc}>
                                Open Google Authenticator or Authy, then scan the code below.
                            </p>
                            {wizardQrCode && (
                                <img src={wizardQrCode} alt="TOTP QR code" className={styles.wizardQr} />
                            )}
                            <p className={styles.wizardManualKey}>
                                Manual key: <code>{wizardSecret}</code>
                            </p>
                            <button
                                className={styles.wizardBtn}
                                type="button"
                                onClick={() => setWizardStep(2)}
                            >
                                Next
                            </button>
                            <button
                                className={styles.wizardCancelBtn}
                                type="button"
                                onClick={() => setWizardOpen(false)}
                            >
                                Cancel
                            </button>
                        </>
                    )}

                    {wizardStep === 2 && (
                        <>
                            <p className={styles.wizardTitle}>Enter the 6-digit code</p>
                            <p className={styles.wizardDesc}>
                                Enter the code shown in your authenticator app to confirm setup.
                            </p>
                            <input
                                className={styles.wizardOtpInput}
                                type="text"
                                inputMode="numeric"
                                placeholder="000000"
                                value={wizardCode}
                                maxLength={6}
                                autoComplete="one-time-code"
                                onChange={e => {
                                    setWizardCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    setWizardError('');
                                }}
                            />
                            {wizardError && <p className={styles.wizardError}>{wizardError}</p>}
                            <button
                                className={styles.wizardBtn}
                                type="button"
                                onClick={handleWizardConfirm}
                                disabled={wizardLoading || wizardCode.length !== 6}
                            >
                                {wizardLoading ? 'Verifying…' : 'Verify'}
                            </button>
                            <button
                                className={styles.wizardCancelBtn}
                                type="button"
                                onClick={() => setWizardStep(1)}
                            >
                                ← Back
                            </button>
                        </>
                    )}

                    {wizardStep === 3 && (
                        <>
                            <p className={styles.wizardTitle}>Save your backup codes</p>
                            <p className={styles.wizardDesc}>
                                Store these codes safely — they won't be shown again. Each code can be used only once.
                            </p>
                            <ol className={styles.backupCodeList}>
                                {wizardCodes.map((c, i) => (
                                    <li key={i} className={styles.backupCode}>{c}</li>
                                ))}
                            </ol>
                            <div className={styles.backupActions}>
                                <button
                                    className={styles.wizardOutlineBtn}
                                    type="button"
                                    onClick={handleCopyCodes}
                                >
                                    {codesCopied ? 'Copied!' : 'Copy all'}
                                </button>
                                <button
                                    className={styles.wizardOutlineBtn}
                                    type="button"
                                    onClick={handleDownloadCodes}
                                >
                                    Download .txt
                                </button>
                            </div>
                            <label className={styles.wizardCheckRow}>
                                <input
                                    type="checkbox"
                                    checked={codesConfirmed}
                                    onChange={e => setCodesConfirmed(e.target.checked)}
                                />
                                I've saved my backup codes
                            </label>
                            <button
                                className={styles.wizardBtn}
                                type="button"
                                onClick={completeSetup}
                                disabled={!codesConfirmed}
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* ── Delete account confirmation ── */}
        {deleteConfirmOpen && (
            <div className={styles.pickerOverlay} onClick={() => setDeleteConfirmOpen(false)}>
                <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>
                    <p className={styles.wizardTitle}>Delete account?</p>
                    <p className={styles.wizardDesc}>
                        This will permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {deleteError && <p className={styles.wizardError}>{deleteError}</p>}
                    <button
                        className={`${styles.wizardBtn} ${styles.wizardBtnDanger}`}
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting…' : 'Yes, delete my account'}
                    </button>
                    <button
                        className={styles.wizardCancelBtn}
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}

        {/* ── Disable 2FA modal ── */}
        {disableOpen && (
            <div className={styles.pickerOverlay} onClick={() => setDisableOpen(false)}>
                <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>
                    <p className={styles.wizardTitle}>Disable Two-Factor Authentication</p>
                    <p className={styles.wizardDesc}>
                        Enter your current TOTP code or a backup code to confirm.
                    </p>
                    <input
                        className={styles.wizardOtpInput}
                        type="text"
                        placeholder="Code"
                        value={disableCode}
                        onChange={e => { setDisableCode(e.target.value); setDisableError(''); }}
                        autoComplete="one-time-code"
                    />
                    {disableError && <p className={styles.wizardError}>{disableError}</p>}
                    <button
                        className={`${styles.wizardBtn} ${styles.wizardBtnDanger}`}
                        type="button"
                        onClick={handleDisable2fa}
                        disabled={disableLoading || !disableCode.trim()}
                    >
                        {disableLoading ? 'Disabling…' : 'Disable 2FA'}
                    </button>
                    <button
                        className={styles.wizardCancelBtn}
                        type="button"
                        onClick={() => setDisableOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}

        </div>
    );
}
