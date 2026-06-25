import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://supermarket3.onrender.com";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});
