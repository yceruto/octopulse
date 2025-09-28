import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, UserSettingsEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { UserSettings, GitHubEvent, PushSubscription, GitHubRepo } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- New OctoPulse Routes ---
  app.post('/api/settings', async (c) => {
    try {
      const { selectedRepo, subscription } = await c.req.json<{ selectedRepo: string; subscription: PushSubscription }>();
      if (!selectedRepo || !subscription) {
        return bad(c, 'Missing required settings fields.');
      }
      const userId = crypto.randomUUID();
      const userSettings: UserSettings = {
        id: userId,
        selectedRepo,
        subscription,
        events: [],
      };
      await UserSettingsEntity.create(c.env, userSettings);
      console.log(`[Worker] Saved settings for user: ${userId}`);
      return ok(c, { userId });
    } catch (error) {
      console.error('[Worker] Error saving settings:', error);
      return bad(c, 'Failed to process settings.');
    }
  });
  app.post('/api/github/repos', async (c) => {
    try {
      const { token } = await c.req.json<{ token: string }>();
      if (!token) {
        return bad(c, 'GitHub token is required.');
      }
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'OctoPulse-App',
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (!response.ok) {
        console.error(`[Worker] GitHub API error: ${response.status} ${response.statusText}`);
        return c.json({ success: false, error: 'Failed to fetch repositories from GitHub.' }, response.status as any);
      }
      const repos: any[] = await response.json();
      const formattedRepos: GitHubRepo[] = repos.map((repo: any) => ({
        id: repo.id,
        full_name: repo.full_name,
      }));
      return ok(c, formattedRepos);
    } catch (error) {
      console.error('[Worker] Error fetching GitHub repos:', error);
      return bad(c, 'Failed to process request for GitHub repositories.');
    }
  });
  app.get('/api/events/:userId', async (c) => {
    const userId = c.req.param('userId');
    const userSettings = new UserSettingsEntity(c.env, userId);
    if (!(await userSettings.exists())) {
      return notFound(c, 'User not found');
    }
    const events = await userSettings.getEvents();
    return ok(c, events);
  });
  app.post('/api/webhook/:userId', async (c) => {
    const userId = c.req.param('userId');
    const githubEvent = c.req.header('X-GitHub-Event');
    const payload = await c.req.json<any>();
    console.log(`[Worker] Webhook received for user: ${userId}, event: ${githubEvent}`);
    const userSettingsEntity = new UserSettingsEntity(c.env, userId);
    if (!(await userSettingsEntity.exists())) {
      console.warn(`[Worker] No settings found for user: ${userId}`);
      return notFound(c, 'User configuration not found.');
    }
    let event: GitHubEvent | null = null;
    if (githubEvent === 'star' && payload.action === 'created') {
      event = {
        id: crypto.randomUUID(),
        type: 'star',
        title: 'New Star!',
        body: `Your repository ${payload.repository.full_name} received a new star from @${payload.sender.login}.`,
        timestamp: new Date().toISOString(),
      };
    } else if (githubEvent === 'watch' && payload.action === 'started') {
        // GitHub uses 'watch' event for stars. This is a common alias.
        event = {
            id: crypto.randomUUID(),
            type: 'star',
            title: 'New Star!',
            body: `Your repository ${payload.repository.full_name} received a new star from @${payload.sender.login}.`,
            timestamp: new Date().toISOString(),
        };
    } else if (githubEvent === 'fork') {
        // A common request is to also be notified of forks.
        event = {
            id: crypto.randomUUID(),
            type: 'follower', // Using 'follower' icon for forks as a visual proxy
            title: 'New Fork!',
            body: `@${payload.sender.login} forked your repository ${payload.repository.full_name}.`,
            timestamp: new Date().toISOString(),
        };
    } else if (githubEvent === 'follow' && payload.action === 'created') {
        // This event is for the user account, not a specific repository
        event = {
            id: crypto.randomUUID(),
            type: 'follower',
            title: 'New Follower!',
            body: `You have a new follower: @${payload.sender.login}.`,
            timestamp: new Date().toISOString(),
        };
    }
    if (event) {
      await userSettingsEntity.addEvent(event);
      const userSettings = await userSettingsEntity.getState();
      // MOCK PUSH NOTIFICATION: The web-push library is not compatible with Cloudflare Workers.
      // In a real-world scenario, you would use a different method or service to send push notifications.
      // For this demo, we will log to the console to confirm the logic is working.
      console.log(`[Worker] MOCK PUSH: Sending notification to user ${userId}`);
      console.log(`[Worker] MOCK PUSH: Title: ${event.title}`);
      console.log(`[Worker] MOCK PUSH: Body: ${event.body}`);
      console.log(`[Worker] MOCK PUSH: Subscription Endpoint: ${userSettings.subscription.endpoint}`);
    }
    return ok(c, { message: 'Webhook received' });
  });
  // --- Existing Demo Routes ---
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}