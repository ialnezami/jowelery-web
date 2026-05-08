# Jowelery Web — Migration Task List

Decoupled Next.js frontend calling NestJS backend at `NEXT_PUBLIC_API_URL`.
Auth pattern: NextAuth session → `session.apiToken` synced to `window.__JWT` via `SessionSync`.

---

## CRITICAL

### [W-1] Fix auth Bearer token on all authenticated API calls ✅ IN PROGRESS
- **Problem:** Many pages call `fetch(\`${B}/...\`)` for auth-required endpoints without `Authorization: Bearer` header. This causes 401 errors at runtime even though TypeScript compiles.
- **Root cause:** Direct `fetch()` bypasses `clientApi()` which auto-reads `window.__JWT`.
- **Fix:** Replace all authenticated direct `fetch()` calls with `api.get/post/patch/delete()` from `@/lib/api`, or manually inject `Authorization: Bearer \${(window as any).__JWT}`.
- **Affected pages:** `dashboard/wishlist`, `dashboard/orders`, `dashboard/addresses`, `dashboard/recipients`, `dashboard/account`, `dashboard/settings`, `dashboard/products`, `dashboard/gold-rates`, `dashboard/analytics`, `dashboard/chat`, `dashboard/coupons`, `dashboard/customers`, `dashboard/payouts`, `cart`, `checkout`
- **Files to use:** `import { api, clientApi } from '@/lib/api'`

---

## HIGH

### [W-2] Shop reviews on shop detail page ✅ IN PROGRESS
- **Missing:** `shops/[id]/page.tsx` shows no reviews. No `dashboard/shop-reviews` page.
- **Backend:** Full CRUD at `/shop-reviews` — `GET /shop-reviews/shop/:shopId`, `POST /shop-reviews`, `PATCH /shop-reviews/:id`, `DELETE /shop-reviews/:id`, `GET /shop-reviews/my-review/:shopId`
- **Gate:** CLIENT must have DELIVERED/COMPLETED order from shop; one review per user per shop
- **Fix:** Add reviews section to `shops/[id]/page.tsx` — average rating, star display, list, write/edit/delete modal for authenticated CLIENTs
- **Reference:** Mobile `ShopReviewsScreen.tsx` at `jowelery-mobile/src/screens/ShopReviewsScreen.tsx`

### [W-3] Wishlist heart toggle on products listing and product detail ✅ IN PROGRESS
- **Missing:** `products/page.tsx` and `products/[id]/page.tsx` have no wishlist button.
- **Backend:** `GET /wishlist`, `POST /wishlist`, `DELETE /wishlist/:productId`
- **Fix:**
  - `products/page.tsx` — add heart icon on each product card, load wishlisted IDs on mount, optimistic toggle
  - `products/[id]/page.tsx` — add heart button near add-to-cart button
  - Guests see heart but get redirected to login on click

### [W-4] Order detail page — tracking timeline ✅ IN PROGRESS
- **File:** `dashboard/orders/[id]/page.tsx`
- **Verify/build:** Should show order status stepper (PENDING_PAYMENT → COMPLETED), items list, shipping address, total, cancel button for cancellable statuses, refund status
- **Backend:** `GET /orders/:id`
- **Reference:** Mobile `OrderDetailScreen.tsx`

---

## MEDIUM

### [W-5] CartProvider auth token
- **Problem:** `CartProvider.tsx` calls `fetch(\`${B}/cart\`)` — verify it sends Bearer token for authenticated users.
- **Fix:** Inject `Authorization: Bearer \${(window as any).__JWT}` header in cart fetch calls.

### [W-6] Product detail page — gold pricing display
- **File:** `products/[id]/page.tsx`
- **Verify:** Shows karat, weight, making charges, dynamic price formula, stock status, shop info, add-to-cart
- **Should display:** `finalPrice = goldRate × weight + makingCharges × weight`

### [W-7] next.config.js — image domains
- **Check:** Cloudinary image domains configured for `next/image` optimization
- **Required domains:** `res.cloudinary.com`, `via.placeholder.com`
- **File:** `next.config.js` or `next.config.mjs`

### [W-8] `.env.example` documentation
- **Create:** `jowelery-web/.env.example` with all required variables:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:4001/api
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET=<min 32 chars>
  NEXT_PUBLIC_ADYEN_ENVIRONMENT=test
  ```

### [W-9] i18n messages completeness
- **Check:** `messages/` folder has `en.json`, `ar.json`, `fr.json`, `ordo.json`
- **Verify:** All translation keys used in pages/components exist in each locale file
- **Missing keys:** Add any that are referenced but undefined (causes runtime errors)

---

## LOW

### [W-10] Dockerfile update for decoupled frontend
- **File:** `Dockerfile`
- **Verify:** No references to Prisma, MongoDB, or internal API setup
- **Should be:** Standard Next.js standalone build

### [W-11] GitHub repo push
- **Status:** Git initialized locally, 2 commits ready
- **Action:** Run `gh repo create ialnezami/jowelery-web --public --source=. --remote=origin --push`
- **Requires:** `brew install gh && gh auth login` (gh CLI not installed)

---

## Done ✅

- All shared components migrated from old app (Header, Footer, CartProvider, ChatBubble, CurrencySwitcher, LanguageSwitcher, OrderTimeline, ImageUpload, AdyenPayment, all shadcn/ui)
- Build passes: `tsc --noEmit` 0 errors, `npm run build` 31 routes
- Admin pages added: coupons, customers, payouts
- Dashboard page nav links updated
- Git initialized, committed
