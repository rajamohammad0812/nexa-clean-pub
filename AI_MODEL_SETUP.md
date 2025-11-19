# 🤖 AI Model Setup Guide

## Quick Start: Switch to Claude 3.5 Sonnet

### Step 1: Get Your Anthropic API Key

1. Go to **https://console.anthropic.com/**
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create Key"**
5. Copy your API key (starts with `sk-ant-api...`)

### Step 2: Add API Key to Your Project

Open `.env.local` and add your Anthropic API key:

```bash
# Anthropic API Key (for Claude)
ANTHROPIC_API_KEY=sk-ant-api-YOUR_KEY_HERE
```

### Step 3: Choose Your AI Model

By default, the app now uses **Claude 3.5 Sonnet**. You can switch models by setting:

```bash
# Choose AI Provider: 'claude' or 'openai'
AI_PROVIDER=claude
```

### Step 4: Restart Your Dev Server

```bash
npm run dev
```

That's it! Your app now uses Claude 3.5 Sonnet! 🎉

---

## 🔄 Switching Between Models

### Use Claude 3.5 Sonnet (Recommended)
```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-api-YOUR_KEY_HERE
```

**Benefits:**
- ✅ 5x cheaper than GPT-4
- ✅ Better at code generation
- ✅ 200K context window
- ✅ More accurate, fewer errors

---

### Use OpenAI GPT-4
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
```

**When to use:**
- If you already have OpenAI credits
- If you prefer GPT-4's style

---

## 📊 Model Comparison

| Feature | Claude 3.5 Sonnet | GPT-4 |
|---------|-------------------|-------|
| **Code Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Speed** | ⚡ Fast | 🐢 Medium |
| **Cost** | 💰 $1.65/project | 💰💰 $7.50/project |
| **Context Window** | 200K tokens | 128K tokens |
| **Best For** | Full-stack apps | General purpose |

---

## 🧪 Test Your Setup

After setting up, test by asking the AI:

```
"Create a simple todo app"
```

You should see:
- ✅ Conversational responses
- ✅ Claude/GPT-4 generating code
- ✅ Files being created
- ✅ Progress indicators

---

## 🔧 Troubleshooting

### Error: "Invalid API Key"
- Double-check your API key in `.env.local`
- Make sure there are no extra spaces
- Restart your dev server

### Error: "Model not found"
- Check `AI_PROVIDER` is set to `'claude'` or `'openai'`
- Verify the API key matches the provider

### Want to use GPT-4o (with vision)?
Change in `executor.ts`:
```typescript
model: 'gpt-4o' // instead of 'gpt-4'
```

---

## 💡 Recommended Setup

**For best results:**
```bash
# Use Claude for code generation
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-api-YOUR_KEY_HERE

# Keep OpenAI key for future vision features
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
```

This gives you:
- ✅ Best code generation (Claude)
- ✅ Future image analysis capability (GPT-4o)
- ✅ Flexibility to switch anytime

---

## 📝 Notes

- **Both API keys work independently** - you can have both configured
- **Switch anytime** by changing `AI_PROVIDER`
- **No code changes needed** - just environment variables
- **Claude is the default** for better quality and lower cost

---

## 🚀 Next Steps

1. Get your Anthropic API key
2. Add it to `.env.local`
3. Restart dev server
4. Start building amazing apps with Claude! 🎉
