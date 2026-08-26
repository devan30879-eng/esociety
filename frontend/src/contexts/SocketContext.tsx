// ============================================================
// Socket Context - Real-time event handling via Socket.IO
// Connects once and provides socket to all components
// ============================================================
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect when user is authenticated
    if (!isAuthenticated || !user) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Join personal room for targeted notifications
      newSocket.emit('join_user_room', user._id);
      // Join role room for role-based broadcasts
      newSocket.emit('join_role_room', user.role);
    });

    newSocket.on('disconnect', () => setConnected(false));

    // ─── Real-time Event Listeners ───────────────────────────

    // Someone arrives at the gate (for residents)
    newSocket.on('visitor_arrived', (data: any) => {
      toast(`🚪 ${data.message}`, { duration: 6000, icon: '🔔' });
    });

    // Admin approves/denies visitor (for security)
    newSocket.on('visitor_status_updated', (data: any) => {
      toast(`✅ Visitor ${data.visitorName}: ${data.status}`, { duration: 4000 });
    });

    // Complaint status changed (for residents)
    newSocket.on('complaint_updated', (data: any) => {
      toast(data.message, { duration: 5000, icon: '📋' });
    });

    // New notice posted (for all)
    newSocket.on('new_notice', (data: any) => {
      toast(`📢 New ${data.type}: ${data.message}`, { duration: 5000 });
    });

    // EMERGENCY ALERT - show with high visibility
    newSocket.on('emergency_alert', (data: any) => {
      toast.error(`🚨 EMERGENCY: ${data.title} - ${data.location || 'Society'}`, {
        duration: 10000,
        style: { background: '#dc2626', color: '#fff', fontWeight: 'bold', fontSize: '16px' },
      });
    });

    // Emergency resolved notification
    newSocket.on('emergency_resolved', (data: any) => {
      toast.success(`✅ Emergency resolved: ${data.title}`, { duration: 5000 });
    });

    newSocket.on('new_complaint', (data: any) => {
      toast(data.message, { duration: 4000, icon: '⚠️' });
    });

    setSocket(newSocket);

    // Cleanup: disconnect socket when user logs out or component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to access socket instance
export const useSocket = () => useContext(SocketContext);
