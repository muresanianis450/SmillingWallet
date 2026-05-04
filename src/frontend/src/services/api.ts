import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080/api';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});