import axios from 'axios';

// Use whatever host the frontend was loaded from (localhost, or a LAN IP when
// accessed from another device) so the API works the same way from a phone.
export const api = axios.create({ baseURL: `http://${window.location.hostname}:4000` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});