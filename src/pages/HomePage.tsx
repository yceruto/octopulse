import React, { useEffect } from 'react';
import { Github, Zap } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/store/settings-store';
import { SetupView } from '@/components/SetupView';
import { DashboardView } from '@/components/DashboardView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/lib/api-client';
import type { PushSubscription } from '@shared/types';
// This key is public and safe to expose on the client.
// The corresponding private key must be kept secret on the server.
const VAPID_PUBLIC_KEY = 'BNo5_s_f2nCo_so5uJ8sB3QnC1yA8Anwz3e-2-ax5yL5zL5zL5zL5zL5zL5zL5zL5zL5zL5zL5zL5zL5zL5zLw';
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
export function HomePage() {
  const isConfigured = useSettingsStore((state) => state.isConfigured);
  const reset = useSettingsStore((state) => state.reset);
  const setNotificationStatus = useSettingsStore((state) => state.setNotificationStatus);
  const setWebhookUrl = useSettingsStore((state) => state.setWebhookUrl);
  const setUserId = useSettingsStore((state) => state.setUserId);
  const completeSetup = useSettingsStore((state) => state.completeSetup);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, []);
  const handleSetupComplete = async (selectedRepo: string) => {
    const toastId = toast.loading('Enabling notifications...');
    try {
      if (!('Notification' in window) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported by your browser.');
      }
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const subscriptionJSON = subscription.toJSON() as PushSubscription;
      const fullSettings = { selectedRepo, subscription: subscriptionJSON };
      const response = await api<{ userId: string }>('/api/settings', {
        method: 'POST',
        body: JSON.stringify(fullSettings),
      });
      setUserId(response.userId);
      setWebhookUrl(`${window.location.origin}/api/webhook/${response.userId}`);
      completeSetup();
      toast.success('Configuration saved! You can now set up your webhook in GitHub.', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable notifications.', { id: toastId });
      // Re-throw to allow SetupView to handle its state
      throw error;
    }
  };
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="absolute inset-0 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <ThemeToggle />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="text-center space-y-4 mb-12">
          <div className="flex justify-center items-center space-x-4">
            <Github className="h-12 w-12 text-violet-500" />
            <Zap className="h-8 w-8 text-foreground" />
            <h1 className="text-5xl md:text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">
              OctoPulse
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get real-time push notifications for GitHub events like new followers and repository stars.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={isConfigured ? 'dashboard' : 'setup'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isConfigured ? (
                <DashboardView onReset={reset} />
              ) : (
                <SetupView onSetupComplete={handleSetupComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="absolute bottom-4 text-center text-sm text-muted-foreground/80">
          <p>Built with ���️ at Cloudflare</p>
        </footer>
      </div>
      <Toaster richColors closeButton />
    </main>
  );
}