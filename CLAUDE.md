# Jowelery Web (Next.js Frontend)

Next.js 14 App Router frontend only — all API routes removed. Calls the NestJS backend at `NEXT_PUBLIC_API_URL`.

## Tech Stack
- **Framework**: Next.js 14 App Router, TypeScript
- **Styling**: Tailwind CSS + Radix UI (`components/ui/`)
- **Auth**: NextAuth.js — credentials provider calls NestJS `/auth/login`, stores JWT in session
- **i18n**: next-intl (en/ar/fr)
- **State**: Zustand for cart

## API calls
All pages use `B = process.env.NEXT_PUBLIC_API_URL` for fetch calls.
- Server Components: use `server.*` from `@/lib/api`
- Client Components: use `api.*` from `@/lib/api` or direct `fetch(\`\${B}/...\`)`

## Auth flow
1. User logs in via NextAuth credentials → NextAuth calls NestJS `POST /api/auth/login`
2. NestJS returns `{ token, user }` → stored in NextAuth session as `session.apiToken`
3. `SessionSync` component syncs `session.apiToken` to `window.__JWT`
4. All client-side API calls read `window.__JWT` for `Authorization: Bearer` header

## Environment Variables
```
API_URL=http://localhost:4001/api            # server-side
NEXT_PUBLIC_API_URL=http://localhost:4001/api # client-side
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Running
```bash
npm install
npm run dev   # http://localhost:3000
```

NestJS backend must be running on port 4001 first.
