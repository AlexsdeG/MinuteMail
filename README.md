# 📧 Private 10-Minute Mail Service

An authentic, self-hosted, ephemeral email service designed for privacy-conscious users. This project allows you to generate temporary email aliases on the fly, receive emails in real-time via WebSockets, and manage them through a sleek dashboard.

## ✨ Features

* **Real-time Inbox:** No refreshing required. Emails appear instantly using Socket.io.
* **Self-Destructing Aliases:** Emails and addresses are automatically purged from PostgreSQL and Redis after their expiration (10 mins for guests, up to 7 days for users).
* **Secure Rendering:** Advanced HTML sanitization via `DOMPurify` to protect against XSS and malicious tracking pixels.
* **Custom SMTP Engine:** Built-in Node.js SMTP server listening on Port 25—no third-party mail providers required.
* **User Accounts:** Optional registration to manage multiple persistent aliases and extended storage.
* **Modern Stack:** NestJS, React + Vite, PostgreSQL, and Redis.

---

## 🛠️ Technical Setup Guide

### 1. Prerequisites

* A Linux VPS (Ubuntu recommended) with **Port 25** unblocked.
* Docker and Docker Compose installed.
* A spare domain name (e.g., `temp-mail.xyz`).

### 2. DNS Configuration (The "Post Office" Setup)

To receive emails, you must tell the internet where your server is. Log into your DNS provider (Hetzner, Cloudflare, etc.) and add:

| Type | Host | Points To | Priority | Purpose |
| --- | --- | --- | --- | --- |
| **A** | `mail` | `YOUR_SERVER_IP` | - | Names your mail server |
| **MX** | `@` | `mail.yourdomain.com` | `10` | Routes mail to your server |

---

### 3. Email Security (SPF, DKIM, DMARC)

Even if you are only receiving mail, these records prevent others from spoofing your domain and maintain your IP's reputation.

#### **SPF (Sender Policy Framework)**

Add a **TXT** record at `@`:

```text
v=spf1 mx ip4:YOUR_SERVER_IP -all

```

#### **DKIM (DomainKeys Identified Mail)**

1. Generate a 2048-bit RSA key pair (use the script in `backend/scripts/gen-dkim.js`).
2. Add a **TXT** record at `default._domainkey`:

```text
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...

```

#### **DMARC**

Add a **TXT** record at `_dmarc`:

```text
v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com

```

---

## 🚀 Quick Start (Development)

1. **Clone the repository:**
```bash
git clone https://github.com/youruser/10-min-mail.git
cd 10-min-mail

```


2. **Start Infrastructure:**
```bash
docker-compose up -d postgres redis

```


3. **Setup Backend:**
```bash
cd backend
npm install
# Copy .env.example to .env and fill in details
npm run start:dev

```


4. **Setup Frontend:**
```bash
cd ../frontend
npm install
npm run dev

```



---

## ⚠️ Important Considerations for Germany (Hosting)

If you are hosting this in Germany, please ensure you follow these legal requirements:

* **Impressum:** If the service is public, a legal notice is mandatory under the TMG.
* **DSGVO:** Ensure your Privacy Policy explains that emails are processed automatically and deleted after the TTL.
* **Port 25:** Many German ISPs (like Telekom) block outgoing Port 25. While this service is "Receive Only," some cloud providers like Hetzner may require a support ticket to enable Port 25 for your VPS.

---

## 🛡️ Security Architecture

The project implements a multi-layer security approach:

1. **SMTP Filtering:** Rejects emails for non-existent or expired aliases immediately during the SMTP handshake.
2. **Rate Limiting:** Protects the `/aliases` endpoint from bot-spamming.
3. **Content Isolation:** Uses a combination of `DOMPurify` and CSS scoping to ensure received emails cannot "break out" of their container.

---

## 📄 License

MIT - Created for personal use and educational purposes.

---

**Would you like me to generate the specific `.env.example` file for you to ensure all the credentials match this README?**