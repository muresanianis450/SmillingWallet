import axios from 'axios';

const BASE_URL = "/api"
/*const BASE_URL = "http://172.20.10.6:8080/api"*/
//const BASE_URL = "/api"

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// ── Attach JWT to every request ───────────────────────────────────────────
api.interceptors.request.use(config => {
    const user = localStorage.getItem('user');
    if (user) {
        const parsed = JSON.parse(user);
        if (parsed.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
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
                const stored = localStorage.getItem('user');
                const refreshToken = stored ? JSON.parse(stored).refreshToken : null;
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(
                    `${BASE_URL}/auth/refresh`,
                    { refreshToken }
                );

                // Update stored user with new tokens
                const currentUser = JSON.parse(localStorage.getItem('user')!);
                const updated = {
                    ...currentUser,
                    token: data.token,
                    refreshToken: data.refreshToken,
                };
                localStorage.setItem('user', JSON.stringify(updated));

                queue.forEach(cb => cb(data.token));
                queue = [];
                original.headers.Authorization = `Bearer ${data.token}`;
                return api(original);
            } catch {
                localStorage.removeItem('user');
                window.location.href = '/'; // bounce to home / login
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);