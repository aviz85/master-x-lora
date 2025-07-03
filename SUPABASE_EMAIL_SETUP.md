# Supabase Email Templates Setup Guide

This guide will help you customize the authentication email templates in your Supabase project for the FLUX.1 Image Generator.

## 🎯 Why Customize Email Templates?

- **Professional Branding**: Match your app's design and branding
- **Better User Experience**: Clear, engaging emails improve user engagement
- **Security**: Include OTP codes as backup for email prefetching issues
- **Consistency**: Maintain consistent messaging across all user touchpoints

## 📧 Available Email Templates

Supabase provides 5 authentication email templates that you can customize:

1. **Confirm Signup** - Email verification for new users
2. **Magic Link** - Passwordless login emails
3. **Reset Password** - Password recovery emails
4. **Invite User** - User invitation emails
5. **Change Email** - Email address change confirmation

## 🛠️ How to Set Up

### Method 1: Using Supabase Dashboard (Recommended)

1. **Access Email Templates**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to **Authentication** → **Email Templates**

2. **Customize Each Template**:
   - Click on each template type (Confirm signup, Magic Link, etc.)
   - Replace the default content with the professional templates provided
   - Click **Save** after each template

3. **Copy Template Content**:
   - Use the HTML templates from the `supabase/email-templates/` folder
   - Each file corresponds to a specific email type

### Method 2: Using Management API

For programmatic setup, you can use the Supabase Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Update email templates
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Welcome to FLUX.1 - Confirm Your Account",
    "mailer_templates_confirmation_content": "<!-- Copy content from confirm-signup.html -->",
    "mailer_subjects_magic_link": "Your FLUX.1 Magic Link",
    "mailer_templates_magic_link_content": "<!-- Copy content from magic-link.html -->",
    "mailer_subjects_recovery": "Reset Your FLUX.1 Password",
    "mailer_templates_recovery_content": "<!-- Copy content from reset-password.html -->",
    "mailer_subjects_invite": "You are Invited to FLUX.1",
    "mailer_templates_invite_content": "<!-- Copy content from invite-user.html -->",
    "mailer_subjects_email_change": "Confirm Your Email Change",
    "mailer_templates_email_change_content": "<!-- Copy content from change-email.html -->"
  }'
```

## 🔧 Template Variables

Your email templates can use these dynamic variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | Full confirmation/action URL | `https://yourapp.com/auth/confirm?token=...` |
| `{{ .Token }}` | 6-digit OTP code | `123456` |
| `{{ .TokenHash }}` | Hashed version of token | `abc123def456...` |
| `{{ .SiteURL }}` | Your app's site URL | `https://yourapp.com` |
| `{{ .Email }}` | User's email address | `user@example.com` |
| `{{ .NewEmail }}` | New email (email change only) | `newemail@example.com` |
| `{{ .Data }}` | User metadata | `{{ .Data.first_name }}` |

## 🎨 Template Features

Our custom templates include:

- **Responsive Design**: Works on all devices
- **Modern Styling**: Professional gradient backgrounds and clean typography
- **Dual Options**: Both clickable buttons and OTP codes
- **Security Notices**: Clear expiration times and security warnings
- **Branded Content**: Consistent FLUX.1 branding throughout
- **Accessibility**: Proper contrast ratios and readable fonts

## 📱 Testing Your Templates

1. **Create Test User**:
   ```bash
   # In your app or via Supabase dashboard
   # Go to Authentication → Users → Create new user
   ```

2. **Test Each Flow**:
   - **Signup**: Create a new user account
   - **Magic Link**: Use passwordless login
   - **Password Reset**: Request password reset
   - **Email Change**: Update email address
   - **Invitation**: Send user invitation

3. **Check Email Rendering**:
   - Verify emails look correct in different email clients
   - Test on mobile and desktop
   - Ensure all links work properly

## 🔒 Security Considerations

### Email Prefetching Protection

Some email providers (like Microsoft Outlook) prefetch links for security scanning. This can consume your confirmation tokens before users click them. Our templates include:

- **OTP Codes**: Backup 6-digit codes as alternatives
- **Clear Instructions**: Users know they have multiple options
- **Expiration Warnings**: Clear timeframes for security

### Best Practices

1. **Short Expiration Times**: Links expire in 1 hour for security
2. **Clear Messaging**: Users understand what action is required
3. **Fallback Options**: OTP codes when links don't work
4. **Security Warnings**: Clear notices about unauthorized requests

## 🎯 Advanced Customization

### Conditional Content

You can create dynamic content based on user data:

```html
{{ if eq .Data.language "en" }}
  <h1>Welcome!</h1>
{{ else if eq .Data.language "es" }}
  <h1>¡Bienvenido!</h1>
{{ else }}
  <h1>Welcome!</h1>
{{ end }}
```

### Custom Branding

Modify the templates to match your brand:

1. **Colors**: Update gradient colors and brand colors
2. **Logo**: Replace "FLUX.1 Image Generator" with your logo
3. **Content**: Customize messaging and feature descriptions
4. **Footer**: Update copyright and contact information

## 🚀 Deployment

1. **Local Development**:
   - Templates work immediately after saving in dashboard
   - Test with local Supabase instance if using CLI

2. **Production**:
   - Deploy templates to production Supabase project
   - Test with real email addresses
   - Monitor email delivery rates

## 📊 Monitoring

Track email performance:

1. **Supabase Dashboard**: Monitor auth events and email delivery
2. **Email Metrics**: Track open rates and click-through rates
3. **User Feedback**: Monitor support requests about email issues

## 🛠️ Troubleshooting

### Common Issues

1. **Images Not Loading**: Use absolute URLs for images
2. **Links Not Working**: Check token expiration and URL format
3. **Styling Issues**: Email clients have limited CSS support
4. **Prefetching Problems**: Ensure OTP codes are prominent

### Support

If you encounter issues:

1. Check Supabase documentation: [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
2. Review template variables and syntax
3. Test with different email providers
4. Contact Supabase support for platform issues

## 📝 Template Maintenance

Keep your templates updated:

1. **Regular Reviews**: Check templates quarterly
2. **User Feedback**: Monitor user complaints about emails
3. **Security Updates**: Update security messaging as needed
4. **Brand Changes**: Update when brand guidelines change

---

**Ready to customize your emails?** 

1. Copy the HTML from `supabase/email-templates/` folder
2. Paste into your Supabase Dashboard → Authentication → Email Templates
3. Test with a new user signup
4. Enjoy professional, branded authentication emails! 