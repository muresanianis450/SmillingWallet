import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { AuthUser } from '../types/types';
import { api } from '../services/api';

/**
 * Drives the Google "authorization code" flow for a custom-styled button.
 * The popup returns a one-time code; the backend exchanges it (POST /auth/google)
 * and returns either a full JWT pair (onLogin) or an MFA challenge (onMfaRequired),
 * mirroring the password-login response so 2FA settings are honored.
 */
export function useGoogleAuth(
    onLogin: (user: AuthUser) => void,
    onMfaRequired?: (tempToken: string, mfaType: 'totp' | 'email') => void,
) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const start = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async ({ code }) => {
            setLoading(true);
            setError('');
            try {
                const res = await api.post('/auth/google', { code });

                if (res.data.requiresMfa) {
                    const type = res.data.mfaType === 'email' ? 'email' : 'totp';
                    if (onMfaRequired) {
                        onMfaRequired(res.data.tempToken, type);
                    } else {
                        // Page has no MFA UI (e.g. Register) — direct the user to Log in.
                        setError('This account has two-factor authentication. Please use the Log in page.');
                    }
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
                setError(err.response?.data?.message || 'Google sign-in failed');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google sign-in was cancelled or failed'),
    });

    return { signInWithGoogle: () => start(), googleError: error, googleLoading: loading };
}
