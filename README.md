# FLUX.1 Image Generator - HTML Only Version

🎨 **Simple HTML/CSS/JS implementation** - The most basic version of the FLUX.1 image generator.

## Features

- ✨ Single HTML file with embedded CSS and JavaScript
- 🎯 Direct API calls to FAL AI (client-side)
- 🎨 Modern gradient UI design
- 📱 Responsive layout
- 🖼️ Basic image generation with prompt and size selection

## Quick Start

1. Open `flux-image-generator.html` in your browser
2. Enter your FAL API key when prompted
3. Write your image description
4. Click "Generate Image"

## API Key

This version requires you to enter your FAL API key directly in the browser. 
⚠️ **Warning**: This exposes your API key in the client-side code. Use only for testing/development.

Get your API key from [FAL AI Dashboard](https://fal.ai/dashboard)

## Switching Between Versions

This repository contains multiple implementations. Switch between them using git branches:

```bash
# HTML Only (current) - Simple client-side implementation
git checkout html-only

# Next.js with Proxy - Server-side API key protection
git checkout main

# Advanced Proxy - Complete server-side implementation
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

## Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **API**: Direct client-side calls to FAL AI
- **Styling**: CSS Grid and Flexbox with gradient backgrounds

## Files

- `flux-image-generator.html` - Complete application in a single file

---

**Next Step**: Try the [Next.js version](../../tree/main) with server-side API key protection! 