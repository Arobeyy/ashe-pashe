# ashepashe (আশেপাশে)

> **Hyperlocal Student & Bachelor Accommodation Finder for Dhaka, Bangladesh.**  
> Find verified rooms, sublets, flatshares, and mess seats near your campus or workplace with radius-based geo-search, interactive Leaflet maps, and direct host messaging.

---

## 🌟 What Has Been Built

ashepashe is a full-stack Next.js 16 web application built with TypeScript, Tailwind CSS v4, shadcn/ui, SQLite via Prisma ORM, and Leaflet. The following core features and pages are fully functional:

| Feature | Description | Key Route |
| :--- | :--- | :--- |
| **Home Feed** | Infinite-scroll listing feed, type filter chips (Room, Flat, Seat, Hostel), "Near Me" GPS trigger, bookmarking, and responsive cards. | `/[lang]` (`/en`, `/bn`) |
| **Interactive Geo-Search** | Interactive Leaflet map with OpenStreetMap, draggable pin, visual radius circles (1–10 km), custom price badges (`৳...`), multi-criteria filters, and mobile floating map/list switcher. | `/[lang]/search` |
| **Listing Detail View** | Photo gallery with lightbox modal, flat specifications, facilities grid, privacy-preserving neighborhood radius map (~260m off-center circle), host card, and moderated comments/Q&A. | `/[lang]/listings/[id]` |
| **Private 1-on-1 Messaging** | Direct tenant-to-host chat threads, pinned listing context header, photo sharing, live auto-polling sync, and unread notification badges. | `/[lang]/messages` |
| **Authentication & Auth Gates** | Secure JWT authentication in `HttpOnly` cookies, registration, login, and smart action gates preserving return paths (`?from=...`). | `/[lang]/login`, `/[lang]/register` |
| **Bilingual Support (i18n)** | Complete localization in English and Bengali (বাংলা) with automatic browser locale detection. | `/en/...`, `/bn/...` |
| **Responsive App Shell** | Seamless single-component responsive layout switching between desktop left sidebar and mobile bottom tab bar (≥44px tap targets). | Global Shell |

---

## 🚀 Quick Start: How to Run & View the App

Follow these simple steps to run the application locally and view what has been built.

### 1. Prerequisites
- **Node.js**: v20 or higher installed on your machine.
- **npm** (comes bundled with Node.js).

### 2. Environment Setup
The project comes preconfigured with a local SQLite database and development JWT secret:
- Verify that `.env.local` exists in the project root:
  ```env
  JWT_SECRET="super-secret-dev-key-change-in-production-min-32-chars"
  ```
  *(If `.env.local` is missing, copy `.env.example` to `.env.local`)*.

### 3. Initialize & Seed the Database
The project uses SQLite (`prisma/dev.db`), meaning zero external database configuration is required.
Seed the database with 4 realistic demo accounts and 8 Dhaka accommodation listings:

```bash
npm run db:seed
```

### 4. Start the Development Server
Run the Next.js development server:

```bash
npm run dev
```

The app will start at **[http://localhost:3000](http://localhost:3000)**.

---

## 🧭 Tour: What to View & Test

Once the dev server is running, open **[http://localhost:3000](http://localhost:3000)** in your browser. Here is a guided tour to test the built features:

### 1. Home Feed (`/en`)
- **Feed & Filter Chips**: Filter listings by type (e.g. *Room*, *Flat*, *Seat*).
- **"Near Me" GPS Trigger**: Click "Near Me" in the top bar to filter listings within a 3.0 km radius of your location (or fallback Dhaka center).
- **Listing Cards**: Notice the image counter pill (`1/2`), area tag, price badge, and bookmark icon.

### 2. Interactive Map & Search (`/en/search`)
- Navigate to **Search** via the bottom nav (mobile) or left sidebar (desktop).
- **Interactive Map**:
  - Click anywhere on the map or drag the center marker to relocate your search center.
  - Adjust the search radius using the preset chips (1 km, 3 km, 5 km, 10 km). Notice the visual boundary circle update in real time.
  - Hover or click on the price badges (`৳8,500`) on the map to view listing popup cards.
- **Filters**: Filter by Rent Range, Accommodation Type, Gender Preference (Male / Female / Any), and Tenant Type.
- **Mobile View**: On smaller screens, toggle between the full-screen list and map using the floating **Map / List** pill.

### 3. Listing Detail Page (`/en/listings/...`)
- Click any listing card from the feed or search page (or open one directly from the seeded listings).
- **Photo Carousel & Lightbox**: Click through photos or open full-screen lightbox view.
- **Privacy Map**: Check the neighborhood map section — note the privacy radius circle protecting the host's exact resident address while indicating the general locality.
- **Comments Thread**: Browse public questions or leave a comment (requires login).

### 4. Private Messaging & Photo Sharing (`/en/messages`)
- Click **"Message Host"** on any listing detail page (e.g., while logged in).
- A 1-on-1 conversation thread opens with the listing's preview card pinned to the top.
- Send messages and upload photo attachments. Messages sync automatically via auto-polling.
- Notice the live unread message count badge in the navigation bar.

### 5. Multi-Language Switcher (English / বাংলা)
- Test bilingual routing by switching URLs:
  - English: `http://localhost:3000/en`
  - Bengali: `http://localhost:3000/bn`

---

## 👥 Demo Test Accounts

The database includes pre-seeded demo accounts with ready-to-test listings and conversations:

| Role | Name | Email | Password | Location / Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Community Admin | `admin@community.test` | `Password123!` | Moderation & Platform Administration |
| **Student Host** | Arif Hossain | `arif@student.test` | `Password123!` | Dhaka University Student (Mirpur Listings) |
| **Working Bachelor** | Rahim Ahmed | `rahim@user.test` | `Password123!` | Software Engineer (Bashundhara Listings) |
| **Medical Student** | Fatima Noor | `fatima@user.test` | `Password123!` | DMC Student (Nilkhet & Dhanmondi Listings) |

> **Tip**: You can log in with one user (e.g. `rahim@user.test`) in your normal browser window, and log in with another (e.g. `arif@student.test`) in an Incognito window to test live messaging between two accounts in real time.

---

## 🛠️ Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server at `http://localhost:3000` |
| `npm run build` | Compiles an optimized production build |
| `npm run start` | Starts the production server after building |
| `npm run db:seed` | Re-seeds the SQLite database with test users, listings, and comments |
| `npm run db:push` | Pushes Prisma schema updates to the SQLite database |
| `npm run lint` | Runs ESLint code style and syntax checks |

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19, TypeScript Strict)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Token-driven CSS variables in `globals.css`)
- **Database & ORM**: SQLite via [Prisma ORM](https://www.prisma.io/) (`prisma/dev.db`)
- **Maps & Geolocation**: [Leaflet](https://leafletjs.com/) + OpenStreetMap via `react-leaflet` (`ssr: false`) with Haversine distance engine
- **Authentication**: JWT signed via `jose` stored in `HttpOnly`, `SameSite=Lax` cookies; passwords hashed with `bcryptjs`
- **Route Protection**: Next.js 16 Route Proxy (`proxy.ts`)
- **Internationalization**: Lightweight dictionary-based i18n (`src/app/[lang]/dictionaries/`)
