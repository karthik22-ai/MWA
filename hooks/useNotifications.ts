import { useState, useEffect, useRef } from 'react';
import { Task } from '../types';

export const useNotifications = (tasks: Task[]) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: 'https://cdn-icons-png.flaticon.com/512/9512/9512670.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/9512/9512670.png',
          ...options,
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
    }
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const checkRoutine = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toDateString();

      // 1. Daily Check-in Logic (Targeting 9 AM)
      const lastCheckIn = localStorage.getItem('lastCheckInNotification');
      
      if (currentHour === 9 && lastCheckIn !== todayStr) {
          sendNotification("Daily Wellness Check-in", { 
              body: "How are you feeling today? Take a moment to log your mood." 
          });
          localStorage.setItem('lastCheckInNotification', todayStr);
      }

      // 2. Task Reminders
      tasks.forEach(task => {
        if (task.completed || !task.dueDate) return;
        
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const minutesUntilDue = timeDiff / 1000 / 60;

        // Notify if due within 15 minutes (and in the future)
        if (minutesUntilDue > 0 && minutesUntilDue <= 15) {
            if (!notifiedTasksRef.current.has(task.id)) {
                sendNotification(`Upcoming Task: ${task.title}`, { 
                    body: `This task is due at ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.` 
                });
                notifiedTasksRef.current.add(task.id);
            }
        }
      });
    };

    // Run check immediately and then every minute
    checkRoutine();
    const intervalId = setInterval(checkRoutine, 60000);

    return () => clearInterval(intervalId);
  }, [permission, tasks]);

  return { permission, requestPermission };
};
