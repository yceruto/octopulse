import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Star, UserPlus, BellOff, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/store/settings-store';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
interface DashboardViewProps {
  onReset: () => void;
}
export function DashboardView({ onReset }: DashboardViewProps) {
  const selectedRepo = useSettingsStore((state) => state.selectedRepo);
  const webhookUrl = useSettingsStore((state) => state.webhookUrl);
  const events = useSettingsStore((state) => state.events);
  const fetchEvents = useSettingsStore((state) => state.fetchEvents);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  const copyToClipboard = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied to clipboard!');
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display">Dashboard</h1>
          <p className="text-muted-foreground">Monitoring <span className="font-semibold text-primary">{selectedRepo}</span></p>
        </div>
        <Button variant="outline" size="icon" onClick={onReset} className="transition-transform hover:rotate-45">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      {webhookUrl && (
        <Alert>
          <Rss className="h-4 w-4" />
          <AlertTitle>Your Webhook URL</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Use this URL in your GitHub repository settings to receive events.</p>
            <div className="flex items-center space-x-2">
              <input
                readOnly
                value={webhookUrl}
                className="font-mono text-sm bg-muted p-2 rounded-md w-full"
              />
              <Button variant="secondary" size="sm" onClick={copyToClipboard}>Copy</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>A live log of stars and new followers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {events.length > 0 ? (
                events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="bg-violet-100 dark:bg-violet-900/50 p-2 rounded-full">
                      {event.type === 'star' ? <Star className="h-5 w-5 text-violet-500" /> : <UserPlus className="h-5 w-5 text-violet-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">{event.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.body}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center space-y-2">
                  <BellOff className="h-8 w-8" />
                  <p className="font-semibold">No events yet</p>
                  <p className="text-sm">Waiting for GitHub to send the first webhook...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}