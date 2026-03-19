# Kyron Medical — Patient Voice AI

Your AI-Powered Healthcare Assistant. Schedule appointments, check prescriptions, and get office information — all through an intelligent conversation. Switch to voice anytime.

**Live**: [https://health.prelude.team/](https://health.prelude.team/)

![Kyron Medical Landing Page](public/screenshot.png)

## Features

- **Smart Scheduling** — AI-powered appointment booking with semantic doctor matching
- **Voice AI** — Seamless handoff from web chat to phone call with full context retention
- **Email & SMS Confirmations** — Automatic appointment confirmations via Resend and Twilio
- **Secure & Private** — HIPAA-compliant design, 24/7 availability, no wait times

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| AI Model | Claude Sonnet (Anthropic) |
| Voice AI | Vapi.ai |
| Email | Resend |
| SMS | Twilio |
| Hosting | AWS EC2 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file with the following:

```
ANTHROPIC_API_KEY=
VAPI_PRIVATE_KEY=
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_APP_URL=
```

## Architecture

```
Browser → nginx (HTTPS :443) → Next.js (PM2, :3000)
                                  ├── /api/chat         → Claude API (tool use loop)
                                  ├── /api/voice        → Vapi API (outbound call)
                                  ├── /api/vapi-webhook → Vapi tool execution during voice calls
                                  └── /api/notify       → Resend + Twilio
```

## Doctors

5 specialists with semantic keyword matching:

| Doctor | Specialty |
|---|---|
| Dr. Sarah Chen | Orthopedics |
| Dr. Michael Rivera | Cardiology |
| Dr. Priya Patel | Dermatology |
| Dr. James Thompson | Gastroenterology |
| Dr. Emily Nakamura | Neurology |

## Deployment

Deployed on AWS EC2 (Ubuntu 22.04) with nginx reverse proxy, PM2 process manager, and Let's Encrypt SSL. See `CLAUDE.md` for full deployment instructions.
