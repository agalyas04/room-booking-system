import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get socket URL from environment (remove /api suffix if present)
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl.replace('/api', '');
    
    if (!socketUrl) {
      console.error('VITE_API_URL is not defined for Socket.io connection');
      return;
    }
    
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
