import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join_room', user.id);
      if (user.role === 'admin' || user.role === 'staff') {
        socket.emit('join_admin', user.id);
      }
    });

    socket.on('status_updated', ({ ticketId, status }) => {
      toast.success(`Complaint ${ticketId} updated to: ${status}`, { duration: 5000, icon: '🔔' });
      window.dispatchEvent(new CustomEvent('complaint_update'));
    });

    socket.on('complaint_submitted', () => {
      window.dispatchEvent(new CustomEvent('complaint_update'));
    });

    socket.on('new_complaint', ({ complaint }) => {
      toast(`New complaint: ${complaint.title}`, { duration: 5000, icon: '📋' });
      window.dispatchEvent(new CustomEvent('admin_complaint_update'));
    });

    socket.on('complaint_assigned', ({ complaint }) => {
      toast.success(`You've been assigned: ${complaint.title}`, { duration: 5000 });
      window.dispatchEvent(new CustomEvent('complaint_update'));
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
