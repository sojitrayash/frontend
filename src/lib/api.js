import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export function getAuthToken() {
  return localStorage.getItem('qv_token');
}

export function setAuthSession({ token, role, schoolName }) {
  localStorage.setItem('qv_token', token);
  localStorage.setItem('qv_role', role);
  if (schoolName) localStorage.setItem('qv_schoolName', schoolName);
}

export function clearAuthSession() {
  localStorage.removeItem('qv_token');
  localStorage.removeItem('qv_role');
  localStorage.removeItem('qv_schoolName');
}

export function getRole() {
  return localStorage.getItem('qv_role');
}

export function getSchoolPrivateKey() {
  return localStorage.getItem('qv_schoolPrivateKey');
}

export function setSchoolPrivateKey(privateKey) {
  localStorage.setItem('qv_schoolPrivateKey', privateKey);
}

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Most common causes:
      // - user not logged in (missing token)
      // - backend JWT_SECRET changed, so old tokens become invalid
      clearAuthSession();
      try {
        if (typeof window !== 'undefined' && window.location?.pathname !== '/') {
          window.location.href = '/';
        }
      } catch {
        // ignore redirect failures
      }
    }
    return Promise.reject(err);
  }
);
