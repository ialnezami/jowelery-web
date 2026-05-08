'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Syncs the NestJS JWT from the NextAuth session into window.__JWT
 * so clientApi() can read it without prop-drilling.
 * Place once in the root layout inside <SessionProvider>.
 */
export default function SessionSync() {
  const { data: session } = useSession();

  useEffect(() => {
    (window as any).__JWT = (session as any)?.apiToken || null;
  }, [session]);

  return null;
}
