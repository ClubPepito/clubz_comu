import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('thomasgllt.fr')) {
      const protocol = window.location.protocol;
      return `${protocol}//api-clubz.thomasgllt.fr/chats`;
    }
  }
  const apiBase = (import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:3000/api';
  return apiBase.replace(/\/api$/, '') + '/chats';
};

const SOCKET_URL = getSocketUrl();

export const useChatSocket = (roomId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('clubz_token');
    if (!token) return;

    // Use /chats namespace
    socketRef.current = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to /chats namespace');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from /chats namespace');
    });

    // Match backend event 'new-message'
    socketRef.current.on('new-message', (message: any) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && isConnected && roomId) {
      // Backend expects roomId as string directly, event 'join-room'
      socketRef.current.emit('join-room', roomId);
      setMessages([]); // Clear messages when switching rooms
      
      return () => {
        socketRef.current?.emit('leave-room', roomId);
      };
    }
  }, [roomId, isConnected]);

  const sendMessage = useCallback((content: string, type: string = 'text', metadata: any = {}) => {
    if (socketRef.current && isConnected && roomId) {
      // Backend event is 'create'
      socketRef.current.emit('create', {
        room_id: roomId,
        content,
        type,
        metadata,
      });
    }
  }, [roomId, isConnected]);

  return {
    isConnected,
    messages,
    setMessages,
    sendMessage,
  };
};
