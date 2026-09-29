# Rentora

### Multi-Tenant Rental Operations & On-Demand Service Dispatch Platform

Rentora is a **multi-tenant SaaS platform** for managing rental properties, tenants, leases, rent invoices, and maintenance requests in one centralized system.

It also provides a **service-provider dispatch system** for assigning plumbers, electricians, and other local service providers to maintenance requests.

---

## 🏛️ System Architecture

```text
                    RENTORA WEB APP
                          │
                       Next.js
                          │
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
       /admin           /owner          /tenant
          │               │               │
          └───────────────┼───────────────┘
                          ↓
                     Backend API
                          ↓
                       MongoDB
```

---

## 📂 Project Structure

```text
rentora/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── owners/
│   │   ├── subscriptions/
│   │   ├── service-providers/
│   │   └── reports/
│   │
│   ├── owner/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── tenants/
│   │   ├── leases/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── maintenance/
│   │   └── reports/
│   │
│   ├── tenant/
│   │   ├── dashboard/
│   │   ├── payments/
│   │   ├── maintenance/
│   │   ├── lease/
│   │   └── profile/
│   │
│   ├── layout.js
│   └── page.js
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   └── layouts/
│
├── lib/
│   ├── api.js
│   ├── auth.js
│   └── utils.js
│
├── hooks/
├── types/
├── public/
│
├── .env.local
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 👥 Main Roles

| Role | Access & Scope | Route Prefix |
| :--- | :--- | :--- |
| **Super Admin** | Platform governance, subscriptions, owners, service provider dispatch fleet & system reports | `/admin` |
| **Owner / Landlord** | Properties, units, tenants, digital leases, rent invoices, payments, and dispatching | `/owner` |
| **Tenant / Renter** | Rental info, online rent payments via SSLCommerz, maintenance tickets & profile | `/tenant` |

---

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes / Central API client
- **Database:** MongoDB
- **Payment Gateway:** SSLCommerz (bKash, Nagad, Visa, Mastercard, Internet Banking)

---

## 🚀 Getting Started

1. **Clone & install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your MongoDB connection string and SSLCommerz credentials.

3. **Run the local development server:**
   ```bash
   pnpm dev
   ```

4. **Access the application:**
   - Landing Page & Portal Switcher: [http://localhost:3000](http://localhost:3000)
   - Super Admin Portal: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
   - Owner Portal: [http://localhost:3000/owner/dashboard](http://localhost:3000/owner/dashboard)
   - Tenant Portal: [http://localhost:3000/tenant/dashboard](http://localhost:3000/tenant/dashboard)
   - Login: [http://localhost:3000/login](http://localhost:3000/login)

---

> Academic Project — Rentora
