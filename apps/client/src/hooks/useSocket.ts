import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Email } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useSocket = (aliasId: string | undefined, onEmailReceived: (email: Email) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!aliasId) return;

    // Initialize socket connection
    // Use path option if backend is configured with a specific path, otherwise default is /socket.io
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Prioritize websocket
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
      // Join the specific room for this alias
      socket.emit('join_alias', { aliasId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Listen for incoming emails
    socket.on('email_received', (newEmail: Email) => {
      console.log('New email received:', newEmail);
      onEmailReceived(newEmail);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [aliasId, onEmailReceived]); // Re-run if aliasId changes
};
