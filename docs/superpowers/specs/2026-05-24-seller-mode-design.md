# Seller Mode — Design Spec
**Date:** 2026-05-24  
**Platform:** jowelery-web (Next.js)  
**Scope:** SHOP_ADMIN role only

---

## Overview

Shop admins need two distinct interfaces:
- **Admin Mode** — the existing full dashboard (products, orders, analytics, settings)
- **Seller Mode** — a simplified, focused view for day-to-day selling operations

A toggle in the top navbar lets the shop admin switch between modes instantly. The active mode is persisted in `localStorage` so it survives page refreshes.

---

## Architecture

### New files
- `app/dashboard/seller/page.tsx` — the Seller Mode dashboard page
- `components/SellerModeToggle.tsx` — the navbar toggle button component

### Modified files
- The existing dashboard navbar/layout — add `<SellerModeToggle />` visible only when `session.user.role === 'SHOP_ADMIN'`

### No changes required
- Prisma schema — no new fields
- API routes — all four sections reuse existing endpoints
- Auth — no new role or permission

---

## Mode Toggle

**Component:** `SellerModeToggle`  
**Visibility:** Rendered only when `session.user.role === 'SHOP_ADMIN'`  
**Persistence:** `localStorage` key `jowelery:sellerMode` (`"true"` | `"false"`)  

Behavior:
- On mount, reads `localStorage` to restore last mode
- Clicking the toggle flips the stored value and navigates:
  - Seller → Admin: `router.push('/dashboard')`
  - Admin → Seller: `router.push('/dashboard/seller')`
- Visual: pill-shaped toggle with "Admin" / "Seller" labels, amber accent on active side

---

## Seller Dashboard Page (`/dashboard/seller`)

Protected: redirects non-`SHOP_ADMIN` users to `/dashboard`.

### Section 1 — Today at a Glance
**Data source:** `GET /api/orders?shopId={id}&status=all` filtered client-side to today's date  
**Displays:**
- Orders placed today (count)
- Revenue today (sum of `totalAmount` on today's orders)
- Completed orders today

Two or three stat cards in a row — simple numbers, no charts.

### Section 2 — Pending Orders
**Data source:** `GET /api/orders?shopId={id}&status=PROCESSING` (and `PENDING_PAYMENT`)  
**Displays:** List of pending orders with:
- Order ID, customer name, total amount, time placed
- One-click action button: "Mark Ready" → calls `PATCH /api/orders/{id}/status` with `status: PROCESSING` or `DELIVERED`
- Capped at 10 most recent; "View all orders" link to full orders page

### Section 3 — Product Search
**Data source:** `GET /api/products?shopId={id}&search={query}`  
**Displays:** Search input → live results showing:
- Product name, karat, weight
- Current calculated price (gold rate × weight + making charges)
- Stock quantity with low-stock highlight (quantity ≤ 5)

No add-to-cart in this view — it's a lookup/reference tool for the seller.

### Section 4 — Low Stock Alerts
**Data source:** `GET /api/products?shopId={id}` filtered client-side for `quantity <= 5`  
**Displays:** Cards showing product name, karat, quantity remaining  
**Empty state:** "All products are well stocked"

---

## UI Style

Follows existing dashboard conventions:
- Color palette: amber-600 primary, gray-900 text, white cards with `shadow-md`
- Card-based layout, same `Card` / `CardContent` components as the rest of the dashboard
- Responsive: single column on mobile, 2-col grid on tablet+
- Loading state: skeleton cards while fetching

---

## Error Handling

- Failed API calls show a toast error (existing `useToast` hook) — page does not crash
- If `shopId` is missing from session, redirect to `/dashboard`
- All data fetches are independent — a failure in one section does not block others

---

## Out of Scope

- Mobile app seller mode (separate effort)
- Seller-specific order creation / POS checkout flow
- Role stored in DB — mode is UI-only
- Notifications or real-time updates
