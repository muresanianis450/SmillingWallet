import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from '../tracking/cookies';

const BASE_URL = "/api"
/*const BASE_URL = "http://172.20.10.6:8080/api"*/
//const BASE_URL = "/api"

/** Cookie name used for the auth session. */
export const AUTH_COOKIE = 'sw_user';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Attach JWT to every request ───────────────────────────────────────────
api.interceptors.request.use(config => {
    const raw = getCookie(AUTH_COOKIE);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.token) {
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch {
            // Corrupt cookie — clear it
            deleteCookie(AUTH_COOKIE);
        }
    }
    return config;
});

// ── Silent token refresh on 401 ───────────────────────────────────────────
let isRefreshing = false;
let queue: Array<(newToken: string) => void> = [];

api.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;

            if (isRefreshing) {
                return new Promise(resolve =>
                    queue.push(token => {
                        original.headers.Authorization = `Bearer ${token}`;
                        resolve(api(original));
                    })
                );
            }

            isRefreshing = true;
            try {
                const raw = getCookie(AUTH_COOKIE);
                const refreshToken = raw ? JSON.parse(raw).refreshToken : null;
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(
                    `${BASE_URL}/auth/refresh`,
                    { refreshToken }
                );

                // Update cookie with new tokens
                const currentRaw = getCookie(AUTH_COOKIE);
                const currentUser = currentRaw ? JSON.parse(currentRaw) : {};
                const updated = {
                    ...currentUser,
                    token: data.token,
                    refreshToken: data.refreshToken,
                };
                setCookie(AUTH_COOKIE, JSON.stringify(updated), 1);

                queue.forEach(cb => cb(data.token));
                queue = [];
                original.headers.Authorization = `Bearer ${data.token}`;
                return api(original);
            } catch {
                // Refresh failed — clear session and redirect to home
                deleteCookie(AUTH_COOKIE);
                window.location.href = '/';
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);
