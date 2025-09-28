import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GitHubEvent } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
type NotificationStatus = 'default' | 'granted' | 'denied';
interface SettingsState {
  isConfigured: boolean;
  userId: string | null;
  selectedRepo: string | null;
  webhookUrl: string | null;
  notificationStatus: NotificationStatus;
  events: GitHubEvent[];
  setUserId: (userId: string) => void;
  setSelectedRepo: (repo: string | null) => void;
  setWebhookUrl: (url: string) => void;
  setNotificationStatus: (status: NotificationStatus) => void;
  completeSetup: () => void;
  addEvent: (event: GitHubEvent) => void;
  fetchEvents: () => Promise<void>;
  reset: () => void;
}
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isConfigured: false,
      userId: null,
      selectedRepo: null,
      webhookUrl: null,
      notificationStatus: 'default',
      events: [], // Remove mock data
      setUserId: (userId) => set({ userId }),
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
      setWebhookUrl: (url) => set({ webhookUrl: url }),
      setNotificationStatus: (status) => set({ notificationStatus: status }),
      completeSetup: () => set({ isConfigured: true }),
      addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
      fetchEvents: async () => {
        const { userId } = get();
        if (!userId) return;
        try {
          const events = await api<GitHubEvent[]>(`/api/events/${userId}`);
          set({ events });
        } catch (error) {
          console.error('Failed to fetch events:', error);
          toast.error('Could not load recent events.');
        }
      },
      reset: () =>
        set({
          isConfigured: false,
          selectedRepo: null,
          webhookUrl: null,
          events: [],
        }),
    }),
    {
      name: 'octopulse-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isConfigured: state.isConfigured,
        userId: state.userId,
        selectedRepo: state.selectedRepo,
        webhookUrl: state.webhookUrl,
        events: state.events,
      }),
    }
  )
);