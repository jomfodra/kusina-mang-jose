// Environment configuration for Vite
export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default {
  APP_URL,
  API_BASE
};
