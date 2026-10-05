# BusinessGrowth

A loyalty program and lightweight CRM for small businesses — coffee shops, salons, retail stores and gyms.

A customer scans a QR code at the checkout, signs up in about twenty seconds and starts earning cashback. The business gets a single dashboard for its customer base, purchases, promotions and money.

No apps to install. No plastic cards. Everything runs in the browser, on a phone or on a laptop.

---

## Table of contents

- [Why it exists](#why-it-exists)
- [Features](#features)
- [Interface](#interface)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Roles](#roles)
- [How the data is protected](#how-the-data-is-protected)
- [Email delivery](#email-delivery)
- [Deployment](#deployment)
- [Pricing](#pricing)
- [Credits](#credits)

---

## Why it exists

Small businesses lose repeat customers because they have no cheap way to keep them. Plastic loyalty cards get lost, dedicated apps never get installed, and spreadsheets do not tell the owner who stopped coming.

BusinessGrowth replaces all three with a QR code at the counter and a dashboard the owner actually reads.

## Features

### For the business

| Area | What it does |
|---|---|
| Sign-up | Email and password, with email confirmation by link |
| QR code | A QR code for the counter and a ready-to-print poster |
| Customer CRM | Search by name, phone or customer code; **New**, **Active** and **VIP** statuses |
| Checkout | Type a customer code on the home screen and the purchase window opens right away |
| Cashback | Bonuses are earned and redeemed server-side, so the numbers cannot be tampered with from the browser |
| Promotions | Launch a promotion and every customer in the program is notified |
| Finances | Income, expenses, profit and margin |
| Analytics | Average check, share of returning customers, dormant customers, suggested actions |
| Export | Download the customer list as a CSV file that opens in Excel |
| Notifications | An alert for every new customer who joins |

### For the customer

- Sign-up straight from the QR code, with nothing to install
- One account holds the bonuses from every participating business
- A **Show at the counter** button with the customer code and a QR code
- Notifications about earned bonuses and new promotions

### For the administrator

- Platform-wide statistics: businesses, customers, turnover, outstanding bonuses
- A searchable list of companies and accounts, with account deletion

## Interface

**Four appearance themes.** Not just light and dark — four designs with their own colors, fonts and corner shapes. The visitor picks one and the choice is remembered.

| Theme | Look |
|---|---|
| Graphite | Dark, gold and teal accents |
| Ivory | Light and warm, forest green with a serif display face |
| Nordic | Light and crisp, blue and amber with a navy sidebar |
| Neon | Dark, violet-to-cyan gradients with lime highlights |

**Three languages.** English, Russian and Kazakh, switchable at any time. English is the default.

**A 3D loyalty card.** The card on the welcome screen sways on its own, can be rotated with the mouse or a finger, and flips to its reverse side when tapped.

**Ambient music.** An optional button plays calm royalty-free background music while the owner works. It is off until someone turns it on, and the choice is remembered.

Heavy visual effects are switched off on phones so that scrolling stays smooth.

## Tech stack

- **React 18** with **TypeScript**
- **Supabase** — PostgreSQL database, authentication and Row Level Security
- **lucide-react** for icons, **qrcode.react** for QR codes
- No UI framework: the design is plain CSS driven by custom properties, which is what makes the four themes possible without duplicating any layout code

## Project structure

```
src/
  App.tsx              entry point: routing, roles, the "About" page
  index.tsx            React root
  config.ts            Supabase URL and key, public site address
  supabaseClient.ts    Supabase connection
  i18n.tsx             translation engine, language / theme / music widget
  types.ts             shared types
  utils.ts             formatting and helpers
  styles.css           all styling, including the four themes
  components/ui.tsx    shared UI: buttons, inputs, modals, the 3D card
  screens/
    Auth.tsx           sign-in, sign-up, password reset, QR join
    Dashboard.tsx      business dashboard shell
    ClientPortal.tsx   customer dashboard
    Admin.tsx          administrator panel
  views/
    Home.tsx           business home screen and checkout
    Clients.tsx        customer list, purchases, CSV export
    Finances.tsx       income and expenses
    Campaigns.tsx      promotions
    Extras.tsx         analytics, QR code, profile, notifications
supabase/
  schema.sql           the entire database in one script
```

## Getting started

### 1. Database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
   The script drops the old tables and users, then recreates everything from scratch — tables, security policies, stored procedures and triggers.
3. Turn on email confirmation for the email provider.
4. In the authentication URL settings, enter the public address of your site. This is what decides where a visitor lands after clicking the confirmation link. See the [Supabase guide on redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

### 2. Configuration

Fill in `src/config.ts`:

| Constant | Where it comes from |
|---|---|
| `SUPABASE_URL` | Project URL, in the project's API settings |
| `SUPABASE_ANON_KEY` | The publishable key from the same page |
| `PUBLIC_APP_URL` | The public address of the deployed site, used in QR codes. Leave it empty to use whatever address the page is currently open at |

### 3. Run it

```bash
npm install
npm start
```

The app opens at `http://localhost:3000`.

## Roles

| Role | How an account gets it |
|---|---|
| Business | Signing up on the **Business** tab |
| Customer | Signing up on the **Customer** tab, or scanning a company's QR code |
| Administrator | The administrator's email address is set in `schema.sql`, in the `handle_new_user` function |

The role is assigned by a database trigger at sign-up, not by the browser, so it cannot be changed from the client side.

## How the data is protected

- **Row Level Security** is enabled on every table. A business can only read its own customers; a customer can only read their own balances.
- **Bonus arithmetic lives in the database.** Purchases and redemptions go through stored procedures, so a modified browser cannot award itself bonuses.
- **The key shipped to the browser is the publishable one.** It grants nothing beyond what the security policies allow.

## Email delivery

Supabase's built-in mail service only delivers to members of the project itself, and only a handful of messages per hour. It is meant for development.

To have confirmation links reach real users, connect your own SMTP provider in the project's authentication settings. Until that is done, sign-ups by people outside the project will not receive their confirmation email.

## Deployment

The project is a standard Create React App build and deploys to Netlify straight from GitHub.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `build` |

The build script already sets `DISABLE_ESLINT_PLUGIN=true` and `CI=false`, so warnings do not fail the build.

After deploying, put the live address into the Supabase authentication URL settings and into `PUBLIC_APP_URL`.

## Pricing

Nothing is charged today. The service runs as a free launch: every feature is open to every business, with no limits and no payment integration. The table below is the intended business model for later.

| Plan | Price | Includes |
|---|---|---|
| Start | Free forever | Up to 50 customers, QR code, cashback, finances |
| Business | 6 990 ₸ / month | Unlimited customers, promotions, analytics, export |
| Network | 13 990 ₸ / month | Up to 5 locations, a shared customer base |

## Credits

Background music by [Kevin MacLeod](https://incompetech.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

© BusinessGrowth, 2026
