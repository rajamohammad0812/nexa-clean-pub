# OAuth Integration Setup Guide

This guide will help you set up Google, GitHub, and Microsoft OAuth authentication for your Nexa Builder application.

## Prerequisites

1. Make sure you have the environment variables configured in your `.env` file
2. Your application should be running on `http://localhost:3000` for development

## 🔵 Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **People API** for newer setups)

### Step 2: Create OAuth Credentials

1. In the Google Cloud Console, navigate to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Select **Web application** as the application type
4. Add these **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)

5. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

6. Save and copy the **Client ID** and **Client Secret**

### Step 3: Update Environment Variables

Add to your `.env` file:

```bash
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
```

## 🐙 GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the application details:
   - **Application name**: Nexa Builder
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: Next Generation Automation Platform
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

### Step 2: Get Credentials

1. After creating the app, note down the **Client ID**
2. Click **Generate a new client secret** and copy the **Client Secret**

### Step 3: Update Environment Variables

Add to your `.env` file:

```bash
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"
```

## 🔷 Microsoft Azure AD Setup

### Step 1: Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **+ New registration**
4. Fill in the registration form:
   - **Name**: Nexa Builder
   - **Supported account types**: Choose based on your needs (usually "Accounts in any organizational directory and personal Microsoft accounts")
   - **Redirect URI**: Select **Web** and enter `http://localhost:3000/api/auth/callback/azure-ad`

### Step 2: Get Application Details

1. After registration, copy the **Application (client) ID**
2. Copy the **Directory (tenant) ID** from the Overview page

### Step 3: Create Client Secret

1. Go to **Certificates & secrets** in your app registration
2. Click **+ New client secret**
3. Add a description and choose expiration period
4. Copy the **Value** (this is your client secret)

### Step 4: Update Environment Variables

Add to your `.env` file:

```bash
AZURE_AD_CLIENT_ID="your_azure_client_id_here"
AZURE_AD_CLIENT_SECRET="your_azure_client_secret_here"
AZURE_AD_TENANT_ID="your_azure_tenant_id_here"
```

## 🚀 Testing the Integration

### Step 1: Start Your Development Server

```bash
npm run dev
```

### Step 2: Test OAuth Providers

1. Navigate to `http://localhost:3000`
2. You should see the login page with social authentication buttons
3. Try each OAuth provider:
   - **Google**: Blue "Continue with Google" button
   - **GitHub**: Dark "Continue with GitHub" button
   - **Microsoft**: Blue "Continue with Microsoft" button

### Step 3: Verify Authentication

After successful authentication, you should:

1. Be redirected back to your application
2. See your main dashboard (the chat interface)
3. Check browser developer tools for any errors

## 🔧 Troubleshooting

### Common Issues

#### 1. "OAuth Error: Invalid Redirect URI"

- **Solution**: Make sure your redirect URIs in the OAuth app settings match exactly with the callback URLs
- **Development**: `http://localhost:3000/api/auth/callback/[provider]`
- **Production**: `https://yourdomain.com/api/auth/callback/[provider]`

#### 2. "Client ID not found" or similar errors

- **Solution**: Double-check that your environment variables are correctly set and the server has been restarted

#### 3. CORS Errors

- **Solution**: Ensure your domain is added to the authorized origins in your OAuth app settings

#### 4. NextAuth Debug Information

- Enable debug mode by adding to your `.env`:
  ```bash
  NEXTAUTH_DEBUG=true
  ```

### Environment Variable Checklist

Make sure these are all set in your `.env` file:

```bash
# Required for NextAuth
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Microsoft Azure AD (optional)
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."
AZURE_AD_TENANT_ID="..."
```

## 📋 Production Deployment

### Update Redirect URIs

When deploying to production, update all OAuth app settings with your production domain:

1. **Google**: Add `https://yourdomain.com` to authorized origins and `https://yourdomain.com/api/auth/callback/google` to redirect URIs
2. **GitHub**: Update Homepage URL to `https://yourdomain.com` and callback URL to `https://yourdomain.com/api/auth/callback/github`
3. **Azure AD**: Add production redirect URI `https://yourdomain.com/api/auth/callback/azure-ad`

### Update Environment Variables

```bash
NEXTAUTH_URL="https://yourdomain.com"
```

## 🎯 Features

- **Secure Authentication**: All OAuth flows are handled securely by NextAuth.js
- **Session Management**: User sessions are automatically managed
- **Multiple Providers**: Users can choose their preferred authentication method
- **Fallback Authentication**: Credentials-based login is still available as a fallback
- **Seamless Integration**: After authentication, users are seamlessly redirected to the main application

## 📞 Support

If you encounter any issues:

1. Check the browser developer console for errors
2. Verify all environment variables are set correctly
3. Ensure OAuth app settings match the callback URLs
4. Try with `NEXTAUTH_DEBUG=true` for detailed logging

The authentication system is now ready to use with your beautiful futuristic UI! 🚀
