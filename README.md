# 🔐 Kodelyx Pay — UPI Auto-Detection Gateway

A premium, self-hosted UPI payment gateway with automatic payment verification via email parsing. Zero transaction fees. Built with Next.js.

## ✨ Features

- **QR-based UPI Payments** — Display a QR code for customers to pay via any UPI app
- **Auto-Detection** — Parses incoming PhonePe email notifications via IMAP to automatically detect payments
- **Transaction ID Verification** — Manual verification using UTR / Transaction ID
- **UPI ID Verification** — Match payments by sender's UPI ID
- **Premium UI** — Animated, glassmorphic checkout flow with Framer Motion
- **Self-Hosted** — No third-party payment gateway dependency. 0% fees.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Framer Motion, Lucide Icons, Sonner Toasts
- **Email Parsing**: IMAP (ImapFlow) + Mailparser
- **Database**: JSON file-based (lightweight, no external DB needed)

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/kodelyx-pay.git
cd kodelyx-pay
bun install  # or npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
# Business Info (shown on frontend)
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_BUSINESS_LOGO=YB
NEXT_PUBLIC_QR_IMAGE_URL=https://your-qr-image-url.png
NEXT_PUBLIC_UPI_ID=your-upi@ybl
NEXT_PUBLIC_ACCESS_FILE_URL=https://your-file-link.com

# IMAP Email Listener (for auto-detection)
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SSL=true

# API
API_WEBHOOK_URL=http://localhost:8090/api/email-webhook
```

### 3. Run

```bash
bun run dev  # or npm run dev
# Opens at http://localhost:8090
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/sync-inbox` | GET | Sync PhonePe emails from Gmail IMAP |
| `/api/detect-payment` | GET | Verify payment by UTR, UPI ID, or auto-detect |
| `/api/email-webhook` | POST | Receive and parse email webhook data |

## 🔒 Security

- `.env` file with credentials is **never** committed to Git
- `database.json` (transaction data) is excluded from version control
- SSL encryption badges shown on checkout UI

## 📄 License

Private — Kodelyx Lab
