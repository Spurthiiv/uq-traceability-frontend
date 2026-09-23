import axios from 'axios';

// In production the backend lives on a completely different host (e.g. a
// Render URL), so VITE_API_URL points there explicitly. Without it (local
// dev), fall back to whatever host the frontend was loaded from on port 4000
// — that's what makes the app work the same way from a phone on the same
// Wi-Fi as from localhost.
const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});