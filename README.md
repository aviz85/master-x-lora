# FLUX.1 Image Generator

A Next.js application for generating images using the FLUX.1 AI model with a secure server-side proxy.

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

## Branches

- `html-only`: Simple HTML/CSS/JS version with client-side API calls
- `main`: Next.js base setup
- `proxy`: Complete application with server-side proxy (current)
