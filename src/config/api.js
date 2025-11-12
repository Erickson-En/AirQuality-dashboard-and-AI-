import axios from 'axios';
import { io } from 'socket.io-client';

// Prefer env; fallback to localhost during dev
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Socket.IO client (single shared instance)
export const socket = io(API_BASE, {
  transports: ['websocket', 'polling'],
});
