import { io } from 'socket.io-client';

export function connectWS() {
    return io('https://websocket-chat-teal.vercel.app/', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
    });
}
