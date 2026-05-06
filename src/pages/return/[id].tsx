import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import axios from 'axios';
import { requestConstants } from '@/constants';

/**
 * Public return-confirmation landing for the email-reminder link
 * (`/return/{id}?t={token}`). The token is signed by the API at
 * notification-send time; we ping the public /verify-token endpoint
 * just to make sure it's still valid before the user takes any
 * action. The full guest-return submission flow is a separate piece
 * of work — for now we route authenticated admins into the existing
 * detail page, where the assignee can mark items returned.
 */
interface ReturnLandingProps {
   requestId: number;
   tokenStatus: 'valid' | 'expired' | 'missing' | 'malformed';
}

export const getServerSideProps: GetServerSideProps<ReturnLandingProps> = async (ctx) => {
   const { id } = ctx.params || {};
   const token = typeof ctx.query?.t === 'string' ? ctx.query.t : null;

   if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return { notFound: true };
   }

   const requestId = Number(id);
   if (!token) {
      return { props: { requestId, tokenStatus: 'missing' } };
   }

   try {
      const resp = await axios.post(
         requestConstants.VERIFY_REQUEST_TOKEN_URI,
         { token },
         { headers: { Accept: 'application/json' } },
      );
      const data = resp?.data?.data;
      if (data?.purpose !== 'return') {
         return { props: { requestId, tokenStatus: 'malformed' } };
      }
      return { props: { requestId, tokenStatus: 'valid' } };
   } catch {
      return { props: { requestId, tokenStatus: 'expired' } };
   }
};

const ReturnLandingPage: NextPage<ReturnLandingProps> = ({ requestId, tokenStatus }) => {
   const heading =
      tokenStatus === 'valid'
         ? `Confirm return of request #${requestId}`
         : tokenStatus === 'expired'
           ? 'This link has expired'
           : tokenStatus === 'missing'
             ? 'Missing link token'
             : 'This link is invalid';

   const body =
      tokenStatus === 'valid'
         ? `Sign in to mark the items as returned. The reminder will stop automatically once the assignee confirms the return on the request page.`
         : tokenStatus === 'expired'
           ? `Reminder links are valid for 72 hours. Ask the logistics team for a fresh link, or sign in directly to update the request.`
           : `The link you opened is incomplete. Open the original email and click the button there — or sign in directly to find the request.`;

   const adminHref = tokenStatus === 'valid' ? `/admin/request/${requestId}` : '/admin/dashboard';
   // Login reads `?from=` to redirect post-auth (see login.tsx — query.from).
   const loginHref = `/login?from=${encodeURIComponent(adminHref)}`;

   return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--surface-paper,_#0F1730)]">
         <div className="w-full max-w-md rounded-2xl bg-[var(--surface-low,rgba(255,255,255,0.04))] border border-white/10 p-8 text-center shadow-xl">
            <div className="mx-auto mb-5 inline-flex items-center justify-center rounded-full w-14 h-14 bg-[var(--color-secondary,_#B28309)]/15">
               <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--color-secondary,_#B28309)]"
               >
                  {tokenStatus === 'valid' ? (
                     <>
                        <path d="M21 12a9 9 0 1 1-9-9" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                     </>
                  ) : (
                     <>
                        <circle cx="12" cy="12" r="9" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                     </>
                  )}
               </svg>
            </div>

            <h1 className="text-xl font-semibold text-white mb-2 tracking-[-0.006em]">{heading}</h1>
            <p className="text-sm text-white/65 leading-relaxed mb-6">{body}</p>

            <div className="flex flex-col gap-2.5">
               <Link
                  href={loginHref}
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--color-secondary,_#B28309)] hover:bg-[var(--color-secondary,_#B28309)]/90 text-white font-medium text-sm px-4 py-2.5 transition-colors"
               >
                  Sign in to confirm return
               </Link>
               <Link
                  href="/"
                  className="inline-flex items-center justify-center text-xs text-white/50 hover:text-white/80 transition-colors"
               >
                  Back to home
               </Link>
            </div>

            <p className="mt-8 text-[0.65rem] text-white/40">
               &copy; {new Date().getFullYear()} EGFM Facility Portal
            </p>
         </div>
      </main>
   );
};

export default ReturnLandingPage;
