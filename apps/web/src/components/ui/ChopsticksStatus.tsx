'use client';

import { useEffect, useState } from 'react';
import ChopsticksService from '@/services/ChopsticksService';

export function ChopsticksStatus() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [showStatus, setShowStatus] = useState(false);
  const chopsticksService = ChopsticksService.getInstance();

  useEffect(() => {
    if (!chopsticksService.isChopsticksMode()) {
      return;
    }

    // Initialize chopsticks on mount
    chopsticksService.startChopsticks();

    // Update status periodically
    const interval = setInterval(() => {
      const currentStatus = chopsticksService.getConnectionStatus();
      setStatus(currentStatus);
      
      // Only show status indicator during connecting or error states
      setShowStatus(currentStatus === 'connecting' || currentStatus === 'error');
    }, 1000);

    return () => clearInterval(interval);
  }, [chopsticksService]);

  // Don't show if not in chopsticks mode or if connected/disconnected
  if (!chopsticksService.isChopsticksMode() || !showStatus) {
    return null;
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return { text: 'Reconnecting to test network...', color: 'text-yellow-500', icon: '🟡' };
      case 'error':
        return { text: 'Test network unavailable', color: 'text-red-500', icon: '🔴' };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  if (!statusDisplay) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-sm">
        <span>{statusDisplay.icon}</span>
        <span className={statusDisplay.color}>{statusDisplay.text}</span>
      </div>
    </div>
  );
} 