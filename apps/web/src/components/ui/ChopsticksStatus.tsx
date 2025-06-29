'use client';

import { useEffect, useState } from 'react';
import ChopsticksService from '@/services/ChopsticksService';
import { toast } from 'react-hot-toast';

export function ChopsticksStatus() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [showStatus, setShowStatus] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const chopsticksService = ChopsticksService.getInstance();

  useEffect(() => {
    if (!chopsticksService.isChopsticksMode()) {
      return;
    }

    // Initialize chopsticks with smart health-check on mount
    chopsticksService.initializeChopsticks();

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

  const handleManualRestart = async () => {
    if (isRestarting) return;
    
    setIsRestarting(true);
    toast.loading('Manually restarting demo environment...', { id: 'manual-restart' });
    
    try {
      await chopsticksService.initializeChopsticks();
      toast.success('Demo environment restarted successfully!', { id: 'manual-restart' });
    } catch (error) {
      toast.error('Manual restart failed. Please try again.', { id: 'manual-restart' });
    } finally {
      setIsRestarting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return { text: 'Setting up demo environment...', color: 'text-yellow-500', icon: '🟡' };
      case 'error':
        return { text: 'Demo environment unavailable', color: 'text-red-500', icon: '🔴', showRestart: true };
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