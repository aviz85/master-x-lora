# FLUX.1 Image Generator - Queue Webhook Version

🎨 **Most advanced implementation with webhook notifications** - Efficient async processing with real-time webhook delivery.

## Features

- 🎨 Generate high-quality images using FLUX.1 AI model
- 🔒 Secure server-side proxy to protect API keys
- 🎯 Simple and intuitive interface
- 📱 Responsive design with Tailwind CSS
- ⚡ Built with Next.js 15 and TypeScript
- 🔄 Queue-based generation with real-time polling
- 📊 Live status updates and generation logs
- ❌ Request cancellation support
- 🪝 Webhook-based generation for efficient async processing
- 🔐 Secure webhook signature verification

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add the following variables:
   ```
   # FAL AI API Key
   FAL_KEY=your_fal_key_here
   
   # App URL for webhooks (use ngrok URL for local development)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Supabase Configuration (for training functionality)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   **Required for all features:**
   - Get your FAL API key from [FAL AI Dashboard](https://fal.ai/dashboard)
   
   **Required for training features:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and keys from the Supabase dashboard
   - Run the migration file `supabase/migrations/001_create_training_tables.sql` in your Supabase SQL editor
   
   **Note**: For webhook functionality in production, set `NEXT_PUBLIC_APP_URL` to your deployed domain.

4. **Configure Supabase Email Templates** (Important for user authentication):
   
   Go to your Supabase Dashboard → Authentication → Email Templates and customize the following templates:

   **Confirm Signup Template:**
   ```html
   <h2>Welcome to FLUX.1 Image Generator!</h2>
   <p>Thank you for signing up. Please confirm your email address to get started.</p>
   <p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Confirm Email</a></p>
   <p>Or use this verification code: <strong>{{ .Token }}</strong></p>
   <p>If you didn't create an account, you can safely ignore this email.</p>
   ```

   **Magic Link Template:**
   ```html
   <h2>Your Magic Link</h2>
   <p>Click the link below to sign in to your account:</p>
   <p><a href="{{ .ConfirmationURL }}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Sign In</a></p>
   <p>Or use this login code: <strong>{{ .Token }}</strong></p>
   <p>This link will expire in 1 hour for security purposes.</p>
   ```

   **Reset Password Template:**
   ```html
   <h2>Reset Your Password</h2>
   <p>We received a request to reset your password. Click the link below to create a new password:</p>
   <p><a href="{{ .ConfirmationURL }}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
   <p>Or use this reset code: <strong>{{ .Token }}</strong></p>
   <p>If you didn't request a password reset, you can safely ignore this email.</p>
   ```

   **Invite User Template:**
   ```html
   <h2>You're Invited!</h2>
   <p>You've been invited to join FLUX.1 Image Generator. Click the link below to accept the invitation:</p>
   <p><a href="{{ .ConfirmationURL }}" style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Accept Invitation</a></p>
   <p>Welcome to our community of AI image creators!</p>
   ```

   **Change Email Template:**
   ```html
   <h2>Confirm Email Change</h2>
   <p>You requested to change your email address to {{ .NewEmail }}.</p>
   <p>Click the link below to confirm this change:</p>
   <p><a href="{{ .ConfirmationURL }}" style="background-color: #0891B2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Confirm Email Change</a></p>
   <p>Or use this confirmation code: <strong>{{ .Token }}</strong></p>
   ```

   **Available Template Variables:**
   - `{{ .ConfirmationURL }}` - The confirmation/action URL
   - `{{ .Token }}` - 6-digit OTP code
   - `{{ .TokenHash }}` - Hashed version of the token
   - `{{ .SiteURL }}` - Your application's site URL
   - `{{ .Email }}` - User's email address
   - `{{ .NewEmail }}` - New email address (for email change)
   - `{{ .Data }}` - User metadata (e.g., `{{ .Data.first_name }}`)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Key Security

This application uses a server-side proxy to securely handle API requests to FAL AI. The API key is stored as an environment variable on the server and never exposed to the client-side code.

## Architecture

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with proxy functionality
- **AI Service**: FAL AI FLUX.1 model for image generation
- **Queue System**: Support for both polling and webhook-based processing
- **Webhook Security**: ED25519 signature verification for webhook authenticity

## Pages

- **/** - Main page with polling-based queue management
- **/webhook** - Alternative page demonstrating webhook-based processing

## Webhook vs Polling

### Polling (Default)
- Real-time status updates every 2 seconds
- Live logs and queue position
- Great for interactive use cases
- Higher server resource usage

### Webhook
- Efficient async processing
- No continuous polling required
- Perfect for batch processing
- Lower server resource usage
- Requires publicly accessible webhook endpoint

## Local Development with Webhooks

For webhook functionality to work locally, you need to expose your local server to the internet since FAL AI needs to send webhook notifications to your endpoint.

### Using ngrok (Recommended)

1. **Install ngrok**:
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your Next.js development server**:
   ```bash
   npm run dev
   ```

3. **In another terminal, expose your local server**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`) and update your `.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

5. **Restart your development server** to pick up the new environment variable.

### Testing Webhooks

1. Go to `/webhook` page
2. Submit an image generation request
3. Check your terminal logs to see the webhook being received
4. The webhook endpoint will log the incoming requests for debugging

**Note**: Each time you restart ngrok, you'll get a new URL and need to update `NEXT_PUBLIC_APP_URL`.

## Switching Between Versions

This repository contains multiple implementations. Switch between them using git branches:

```bash
# HTML Only - Simple client-side implementation
git checkout html-only

# Next.js Basic - Server-side API key protection
git checkout main

# Advanced Proxy - Complete server-side implementation
git checkout proxy  

# Queue Polling - Real-time status updates and queue management
git checkout queue-polling

# Queue Webhook (current) - Most advanced with webhook notifications
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

**🎉 You're using the most advanced version!** This implementation includes all features from previous versions plus webhook notifications.
