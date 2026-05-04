import axios from 'axios';

//const BASE_URL = "http://172.20.10.6:8080/api"
const BASE_URL = "/api"

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});