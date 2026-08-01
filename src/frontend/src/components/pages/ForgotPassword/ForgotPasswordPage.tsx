import {useState} from 'react';
import {api} from '../../../services/api';
import {BlobBackground} from '../../shared/BlobBackground';
import styles from '../Login/LoginPage.module.css';

interface Props { setPage: (page: any) => void; }

export function ForgotPasswordPage({ setPage }: Props) {
    const [email, setEmail]   = useState('');
    const [sent, setSent]     = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
        } finally {
            setSent(true); // always show success — don't leak email existence
            setLoading(false);
        }
    }

    return (
        <div className={styles.wrap}>
            <BlobBackground />
            <div className={styles.card}>
                <h2 className={styles.title}>Password Recovery</h2>
                {sent ? (
                    <p style={{ textAlign: 'center', color: '#27ae60' }}>
                        If that email is registered, a reset link is on its way.
                        Check your inbox.
                    </p>
                ) : (
                    <>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            Enter your account email and we'll send you a reset link.
                        </p>
                        <div className={styles.field}>
                            <label className={styles.label}>Email address</label>
                            <input
                                className={styles.input}
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>
                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={loading || !email}
                        >
                            {loading ? 'Sending…' : 'Send Reset Link'}
                        </button>
                    </>
                )}
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        className={styles.link}
                        onClick={() => setPage('login')}
                    >
                        ← Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}