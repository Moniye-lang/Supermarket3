// src/socket.js
import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});
