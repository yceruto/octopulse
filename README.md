# OctoPulse

A minimalist PWA to receive real-time push notifications for GitHub events like new followers and repository stars.

[cloudflarebutton]

## Overview

OctoPulse is a modern, minimalist Progressive Web App (PWA) designed to provide developers with real-time push notifications for important GitHub events. The primary goal is to bridge the gap between GitHub activity and immediate awareness, without needing to check emails or the GitHub dashboard.

The application features a streamlined, one-page setup process where users can link their GitHub account using a Personal Access Token (PAT), select a repository to monitor, and enable push notifications with a single click. Once configured, a clean dashboard displays a log of recent events. The backend is built on a Cloudflare Worker, acting as a highly available webhook listener, processing incoming events from GitHub and dispatching push notifications instantly to the user's subscribed devices.

## Key Features

- **Real-Time Notifications**: Get instant push notifications for new followers and repository stars.
- **Progressive Web App (PWA)**: Installable on any device for a native-app-like experience and offline capabilities.
- **Simple Setup**: A single-page interface to configure your GitHub token, select a repository, and enable notifications.
- **Event Dashboard**: A clean, chronological log of all received events.
- **Secure & Performant**: Built on the Cloudflare ecosystem, ensuring a fast, secure, and globally available service.
- **Privacy-Focused**: Your GitHub Personal Access Token is handled securely on the backend and is not stored long-term.

## Technology Stack

- **Frontend**:
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Zustand](https://zustand-demo.pmnd.rs/) for state management
  - [Framer Motion](https://www.framer.com/motion/) for animations
- **Backend**:
  - [Cloudflare Workers](https://workers.cloudflare.com/)
  - [Hono](https://hono.dev/)
  - [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) for stateful coordination
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) as the package manager and runtime
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/octopulse.git
    cd octopulse
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Authenticate with Cloudflare:**
    This will allow Wrangler (the Cloudflare CLI) to manage resources on your behalf.
    ```bash
    bun wrangler login
    ```

4.  **Create local environment variables:**
    Create a file named `.dev.vars` in the root of the project. This file will be used by Wrangler for local development.
    ```
    # .dev.vars
    # Add any necessary secrets here for local development in future phases.
    # For now, this file can be empty.
    ```

### Running in Development Mode

To start the local development server for both the frontend and the worker, run:

```bash
bun dev
```

This command will:
- Start the Vite development server for the React frontend (usually on `http://localhost:3000`).
- Start a local Wrangler process to simulate the Cloudflare Worker environment.
- API requests from the frontend will be automatically proxied to the local worker.

## Deployment

This project is designed for easy deployment to the Cloudflare network.

### One-Click Deploy

You can deploy this application to your own Cloudflare account with a single click.

[cloudflarebutton]

### Manual Deployment via CLI

1.  **Build the application:**
    This command bundles the React frontend and prepares the worker for deployment.
    ```bash
    bun build
    ```

2.  **Deploy to Cloudflare:**
    This command uploads your built assets and worker script to your Cloudflare account.
    ```bash
    bun deploy
    ```

After deployment, Wrangler will output the URL of your live application.

## Project Structure

```
.
├── public/         # Static assets, manifest.json, and sw.js
├── src/            # Frontend React application
│   ├── components/   # UI components (including shadcn/ui)
│   ├── pages/      # Page components
│   ├── store/      # Zustand state management stores
│   └── lib/        # Utility functions and API client
├── worker/         # Cloudflare Worker backend code (Hono)
├── shared/         # TypeScript types shared between frontend and worker
├── index.html      # Entry point for the React app
├── tailwind.config.js # Tailwind CSS configuration
├── vite.config.ts  # Vite configuration
└── wrangler.jsonc  # Cloudflare Worker configuration
```