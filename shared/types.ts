// DEMO TYPES - can be removed later
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}
// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// OCTOPULSE TYPES
export interface GitHubRepo {
  id: number;
  full_name: string;
}
export interface UserSettings {
  id: string; // User ID
  selectedRepo: string;
  subscription: PushSubscription;
  events: GitHubEvent[];
}
export interface GitHubEvent {
  id: string;
  type: 'star' | 'follower';
  title: string;
  body: string;
  timestamp: string;
}
// A standard PushSubscription object from the browser's Push API
export interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}
export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}