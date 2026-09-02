# Lot — a Whatnot-style live auction marketplace

A working starting point for a live-shopping/auction site: storefronts, live
listings, real-time bidding, live chat, a seller dashboard, and a checkout
flow wired for Stripe.

## What's actually here

- **Next.js 14 (App Router) + TypeScript + Tailwind** — the whole frontend and API layer.
- **Prisma + SQLite** (dev) — swap to Postgres in one line for production.
- **Socket.io** — real-time bidding and chat, run through a custom `server.js`.
- **JWT cookie auth** — simple email/password accounts, buyer or seller role.
- **Stripe Checkout** — stubbed in; add a key and it works.

## What's intentionally *not* here

Two pieces need real third-party infrastructure that can't be built from
scratch in a codebase — you'll plug in an account for each:

1. **Live video streaming.** This app has no actual camera/broadcast pipeline.
   The listing page has a clearly marked slot where a video player goes. To
   add real streaming, the fastest paths are:
   - [LiveKit Cloud](https://livekit.io) — open-source WebRTC, generous free tier, good React SDK.
   - [Mux](https://mux.com) — simplest for RTMP-in/HLS-out (seller streams from OBS or their phone).
   - [Agora](https://agora.io) — mature, widely used for live commerce specifically.
   Any of these gives you a room/token API and a `<video>` embed — you'd
   create the room when a listing goes live and swap the placeholder `<div>`
   in `components/ListingRoom.tsx` for their player component.

2. **A live Stripe account.** The checkout route works against Stripe's test
   mode with zero setup (get a free key at
   dashboard.stripe.com/test/apikeys). To take real payments you'll need to
   complete Stripe's business verification and switch to live keys.

## Running it locally

```bash
npm install
cp .env.example .env          # fill in JWT_SECRET at minimum
npx prisma db push            # creates prisma/dev.db and the schema
npm run db:seed               # optional: adds a demo seller + listings
npm run dev
```

Visit `http://localhost:3000`. Demo accounts after seeding:
- `seller@demo.com` / `password123`
- `buyer@demo.com` / `password123`

As the seller, go to **Dashboard**, create a listing, then **Go live**. Open
the listing in a second browser (or incognito window) signed in as the
buyer, and you'll see bids and chat sync between the two in real time.

## Project structure

```
app/
  page.tsx                 home feed (live / upcoming / ended)
  listing/[id]/page.tsx    listing detail — fetches data, hands off to ListingRoom
  store/[slug]/page.tsx    seller storefront
  dashboard/page.tsx       seller's listing management
  login/, signup/          auth pages
  api/
    auth/                  signup, login, logout
    listings/              create listings, go-live
    checkout/              Stripe Checkout session creation
components/
  ListingRoom.tsx          the live room: video slot + bidding + chat (client component, socket.io)
  NavBar.tsx, NewListingForm.tsx, GoLiveButton.tsx, LogoutButton.tsx
lib/
  prisma.ts                Prisma client singleton
  auth.ts                  session signing/verification
prisma/
  schema.prisma            data model
  seed.js                  demo data
server.js                  custom server: Next.js + Socket.io together
```

## Deploying

The custom Socket.io server (`server.js`) means this **won't run on Vercel's
default serverless setup** — Vercel doesn't support long-lived socket
connections in serverless functions. Two straightforward options:

- **Render, Railway, or Fly.io** — deploy as a standard Node app (`npm run
  build && npm start`), Postgres add-on for `DATABASE_URL`. This is the path
  of least resistance and where I'd start.
- **Vercel for the app + a separate small service for realtime** (e.g. a
  tiny Socket.io server on Railway, or swap Socket.io for a hosted realtime
  service like Pusher or Ably) if you specifically want Vercel's frontend
  hosting.

Either way: set `DATABASE_URL` (Postgres), `JWT_SECRET`, and
`STRIPE_SECRET_KEY` as environment variables on the host, then run
`npx prisma db push` against the production database once.

## Sensible next steps, roughly in order

1. Wire in one of the video providers above so listings actually stream.
2. Add image upload (e.g. UploadThing or S3) instead of pasting image URLs.
3. Add an "ending soon" countdown and auto-close listings server-side when `endsAt` passes.
4. Notifications (email or push) when a buyer is outbid or wins a lot.
5. Seller payouts — Stripe Connect, since right now all payment flows to your single Stripe account.
6. Moderation for chat and listings before this is public.

## Design notes

The visual identity ("Lot") leans into the auction-house register rather
than generic marketplace styling — a dark ink/chalk palette, a single
hammer-red accent reserved for live and bidding states, Fraunces for display
type against Inter for body copy. Feel free to swap the palette in
`tailwind.config.js` — it's centralized there.
