import { io } from 'socket.io-client';

export function connectWS() {
    return io('https://potential-space-carnival-7j9gx99w9v5frpp-4600.app.github.dev');
}
