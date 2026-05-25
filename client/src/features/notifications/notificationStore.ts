import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (message: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 'init-1',
      message: 'System initialized and connected to services.',
      read: false,
      timestamp: new Date(Date.now() - 60000 * 5).toISOString() // 5 min ago
    },
    {
      id: 'init-2',
      message: 'Eureka Service Discovery status: OK',
      read: false,
      timestamp: new Date(Date.now() - 60000 * 2).toISOString() // 2 min ago
    }
  ],
  addNotification: (message: string) => {
    const newItem: NotificationItem = {
      id: Math.random().toString(36).substring(2, 11),
      message,
      read: false,
      timestamp: new Date().toISOString()
    };
    set((state) => ({
      notifications: [newItem, ...state.notifications]
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  }
}));
