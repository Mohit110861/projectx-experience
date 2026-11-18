import axios from 'axios';

export const API_ORIGIN = 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_ORIGIN}/api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// A blocked user's token stops working: log them out
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 403 && error.response?.data?.blocked) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login?blocked=1';
        }
        return Promise.reject(error);
    }
);

// Uploaded files live on the API server (/uploads/...); bundled defaults live in /media
export const mediaUrl = (url) => (url && url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url || '');

export default api;
