import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const socket: Socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
});

const socketService = {
    connect: () => {
        if (!socket.connected) {
            socket.connect();
        }
        return socket;
    },
    disconnect: () => {
        if (socket.connected) {
            socket.disconnect();
        }
    },
    on: (event: string, callback: any) => {
        socket.on(event, callback);
    },
    off: (event: string) => {
        socket.off(event);
    },
    emit: (event: string, data: any) => {
        socket.emit(event, data);
    }
};

export default socketService;
