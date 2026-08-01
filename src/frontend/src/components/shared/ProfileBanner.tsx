import {useEffect, useState} from 'react';
import {PageName} from '../../types/types';
import styles from './ProfileBanner.module.css';

const DISMISS_KEY = 'profileBannerDismissedAt';
const DISMISS_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface ProfileBannerProps {
    pct: number;
    missingFields: string[];
    setPage: (page: PageName) => void;
    onFocusField: (field: string) => void;
}

export function ProfileBanner({ pct, missingFields, setPage, onFocusField }: ProfileBannerProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (pct >= 100) {
            setVisible(false);
            return;
        }
        const raw = localStorage.getItem(DISMISS_KEY);
        if (raw) {
            const elapsed = Date.now() - parseInt(raw, 10);
            if (elapsed < DISMISS_TTL) return;
        }
        setVisible(true);
    }, [pct]);

    function dismiss() {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
    }

    function goToProfile() {
        const firstMissing = missingFields[0] || 'city';
        onFocusField(firstMissing);
        setPage('profile');
    }

    if (!visible) return null;

    return (
        <div className={styles.banner}>
            <span className={styles.msg}>
                Complete your profile to get the most out of Smiling Wallet — <strong>{pct}%</strong> done
            </span>
            <div className={styles.actions}>
                <button className={styles.completeBtn} onClick={goToProfile} type="button">
                    Complete Profile
                </button>
                <button className={styles.dismissBtn} onClick={dismiss} type="button">
                    Dismiss
                </button>
            </div>
        </div>
    );
}
