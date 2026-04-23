import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // We useRef to keep a mutable reference to the latest user ID to avoid stale closures
  const currentUserId = useRef(user?._id);

  useEffect(() => {
    currentUserId.current = user?._id;
  }, [user?._id]);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket.io backend
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('🔗 Connected to Socket Server');
      setIsConnected(true);
      // Register this socket specifically to our User ID room
      if (currentUserId.current) {
        socketInstance.emit('register', currentUserId.current);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from Socket Server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
