# Jowelery Web — Migration Task List

Decoupled Next.js frontend calling NestJS backend at `NEXT_PUBLIC_API_URL`.
Auth pattern: NextAuth session → `session.apiToken` synced to `window.__JWT` via `SessionSync`.

---

## MEDIUM (remaining)

### [W-9] i18n messages completeness
- **Check:** `messages/` folder has `en.json`, `ar.json`, `fr.json`, `ordo.json`
- **Verify:** All translation keys used in pages/components exist in each locale file
- **Missing keys:** Add any that are referenced but undefined (causes runtime errors)

---

## LOW (remaining)

### [W-10] Dockerfile update for decoupled frontend
- **File:** `Dockerfile`
- **Verify:** No references to Prisma, MongoDB, or internal API setup
- **Should be:** Standard Next.js standalone build

### [W-11] GitHub repo push
- **Status:** Git initialized locally, 8 commits ready
- **Action:** Run `gh repo create ialnezami/jowelery-web --public --source=. --remote=origin --push`
- **Requires:** `brew install gh && gh auth login` (gh CLI not installed)

---

## Done ✅

- All shared components migrated (Header, Footer, CartProvider, ChatBubble, CurrencySwitcher, LanguageSwitcher, OrderTimeline, ImageUpload, AdyenPayment, all shadcn/ui)
- Build passes: `tsc --noEmit` 0 errors
- **[W-1]** Bearer token fixed on all authenticated API calls (13 dashboard/cart pages)
- **[W-2]** Shop reviews section on `shops/[id]/page.tsx` — avg rating, distribution bars, write/edit/delete
- **[W-3]** Wishlist heart toggle on `products/page.tsx` and `products/[id]/page.tsx` — optimistic update
- **[W-4]** Order detail `dashboard/orders/[id]/page.tsx` — 8-step timeline, cancel button, admin status update, refund dialog
- **[W-5]** CartProvider auth token — uses `window.__JWT` Bearer header
- **[W-6]** Product detail gold pricing display — formula shown, add-to-cart, shop info
- **[W-7]** `next.config.js` image domains — `res.cloudinary.com`, `via.placeholder.com`
- **[W-8]** `.env.example` created with all required variables
- Admin pages added: coupons, customers, payouts, dashboard page nav links updated
- **Admin products** — full CRUD with ImageUpload, shop selector for SUPER_ADMIN, PATCH toggle active
- **Admin orders list** — status filter, shop filter (SUPER_ADMIN), inline status change, refund with reason
- **Admin settings** — tabbed: System Config, Shop Management, Gold Rates, Admin Users
- **Analytics dashboard** — CSS bar charts (orders by status, top products, revenue by shop), recent orders table
- **Gold rates page** — current rates table, sync button, manual override per karat
- Git initialized, 8 commits
