import axios from 'axios';

// The base URL relies on the Vite proxy we set up
const api = axios.create({
    baseURL: '/api',
});

// Attach JWT from localStorage before every request leaves the frontend
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Automatically clear client auth state if the backend rejects an expired/invalid token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('role');
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default api;
