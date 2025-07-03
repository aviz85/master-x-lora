# FLUX.1 Image Generator - Advanced Proxy Version

🎨 **Complete server-side proxy implementation** - Enhanced security and robust API handling.

## Features

- 🎨 Generate high-quality images using FLUX.1 AI model
- 🔒 Secure server-side proxy to protect API keys
- 🎯 Simple and intuitive interface
- 📱 Responsive design with Tailwind CSS
- ⚡ Built with Next.js 15 and TypeScript

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your FAL API key:
   ```
   FAL_KEY=your_fal_key_here
   ```
   
   Get your API key from [FAL AI Dashboard](https://fal.ai/dashboard)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Key Security

This application uses a server-side proxy to securely handle API requests to FAL AI. The API key is stored as an environment variable on the server and never exposed to the client-side code.

## Architecture

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with proxy functionality
- **AI Service**: FAL AI FLUX.1 model for image generation

## Switching Between Versions

This repository contains multiple implementations. Switch between them using git branches:

```bash
# HTML Only - Simple client-side implementation
git checkout html-only

# Next.js Basic - Server-side API key protection
git checkout main

# Advanced Proxy (current) - Complete server-side implementation
git checkout proxy  

# Queue Polling - Real-time status updates and queue management
git checkout queue-polling

# Queue Webhook - Most advanced with webhook notifications
git checkout queue-webhook
```

## Version Comparison

| Feature | HTML Only | Main | Proxy | Queue Polling | Queue Webhook |
|---------|-----------|------|-------|---------------|---------------|
| Complexity | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| API Key Security | ❌ | ✅ | ✅ | ✅ | ✅ |
| Real-time Updates | ❌ | ❌ | ❌ | ✅ | ✅ |
| Queue Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Webhook Support | ❌ | ❌ | ❌ | ❌ | ✅ |

---

**Next Step**: Try the [Queue Polling version](../../tree/queue-polling) with real-time updates!
