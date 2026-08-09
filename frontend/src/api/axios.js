import axios from 'axios';

// The base URL relies on the Vite proxy we set up earlier
const api = axios.create({
    baseURL: '/api',
});

// Intercept every request before it leaves the frontend
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;