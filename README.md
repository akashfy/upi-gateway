# 🔐 UPI Gateway — Self-Hosted Payment Verification System

A self-hosted UPI payment gateway with **automatic payment detection** via email parsing. Accept payments with **zero transaction fees** — no Razorpay, no Stripe, no middleman.

## ✨ Features

- **QR Code Payments** — Show a UPI QR code, customer pays via any UPI app (GPay, PhonePe, Paytm, etc.)
- **Auto-Detection** — Automatically detects payments by parsing incoming PhonePe email notifications via IMAP
- **Transaction ID Verification** — Manual verification using UTR / Transaction ID
- **UPI ID Verification** — Match payments by sender's UPI ID
- **Premium Animated UI** — Smooth checkout flow with Framer Motion animations
- **Zero Fees** — No payment gateway charges. Direct UPI to your bank.
- **Fully Configurable** — Set your own business name, logo, QR code, and UPI ID via `.env`

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React, Framer Motion, Lucide Icons, Sonner Toasts
- **Email Parsing**: IMAP (ImapFlow) + Mailparser
- **Database**: JSON file-based (lightweight, no external DB needed)

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/akashfy/upi-gateway.git
cd upi-gateway
npm install  # or bun install
```

### 2. Configure Environment

Create a `.env` file:

```env
# Business Info (shown on frontend — customize these)
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_BUSINESS_LOGO=YB
NEXT_PUBLIC_QR_IMAGE_URL=https://your-qr-image-url.png
NEXT_PUBLIC_UPI_ID=your-upi@ybl
NEXT_PUBLIC_ACCESS_FILE_URL=https://your-download-link.com

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
npm run dev  # or bun run dev
# Opens at http://localhost:8090
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/sync-inbox` | GET | Sync payment emails from Gmail IMAP |
| `/api/detect-payment` | GET | Verify payment by UTR, UPI ID, or auto-detect |
| `/api/email-webhook` | POST | Receive and parse email webhook data |

## ⚙️ How It Works

1. Customer enters name/phone → sees your UPI QR code
2. Customer pays via any UPI app
3. PhonePe sends a payment confirmation email to your Gmail
4. Gateway reads the email via IMAP and saves transaction to DB
5. Customer enters Transaction ID or UPI ID → payment verified ✅
6. Customer gets access to your file/product

## 🔒 Security

- `.env` credentials are **never** committed to Git
- `database.json` (transaction data) is excluded from version control
- All business info is configurable via environment variables

## 📄 License

MIT
