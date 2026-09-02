'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SessionPayload } from '@/lib/auth';

type Listing = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  currentPrice: number;
  bidIncrement: number;
  storeName: string;
  storeSlug: string;
};

type BidEvent = { id: string; userName: string; amount: number; createdAt: string };
type ChatEvent = { id: string; userName: string; message: string; createdAt: string };

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ListingRoom({
  listing,
  initialBids,
  initialChat,
  session,
}: {
  listing: Listing;
  initialBids: BidEvent[];
  initialChat: ChatEvent[];
  session: SessionPayload | null;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [currentPrice, setCurrentPrice] = useState(listing.currentPrice);
  const [bids, setBids] = useState<BidEvent[]>(initialBids);
  const [chat, setChat] = useState<ChatEvent[]>(initialChat);
  const [bidError, setBidError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [justBid, setJustBid] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.emit('room:join', { listingId: listing.id });

    socket.on('bid:accepted', (bid: BidEvent) => {
      setCurrentPrice(bid.amount);
      setBids((prev) => [bid, ...prev].slice(0, 20));
      setBidError('');
      setJustBid(true);
      setTimeout(() => setJustBid(false), 600);
    });

    socket.on('bid:rejected', ({ reason }: { reason: string }) => {
      setBidError(reason);
    });

    socket.on('chat:new', (msg: ChatEvent) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [listing.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  function placeBid(amount: number) {
    if (!session) {
      setBidError('Sign in to place a bid.');
      return;
    }
    socketRef.current?.emit('bid:new', {
      listingId: listing.id,
      userId: session.userId,
      userName: session.name,
      amount,
    });
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !chatInput.trim()) return;
    socketRef.current?.emit('chat:send', {
      listingId: listing.id,
      userId: session.userId,
      userName: session.name,
      message: chatInput,
    });
    setChatInput('');
  }

  async function handleCheckout() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Checkout is not available yet.');
    }
  }

  const nextBid = currentPrice + listing.bidIncrement;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="font-mono text-xs uppercase tracking-widest text-ink/40">
        <a href={`/store/${listing.storeSlug}`} className="hover:text-hammer">{listing.storeName}</a>
      </p>
      <h1 className="mt-1 font-display text-3xl text-ink">{listing.title}</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr,1fr]">
        {/* Stream / media column */}
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded bg-ink">
            {listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover opacity-80" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-chalk/30 text-4xl">
                {listing.title.slice(0, 1)}
              </div>
            )}

            {listing.status === 'LIVE' ? (
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded bg-hammer px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-chalk">
                <span className="h-1.5 w-1.5 rounded-full bg-chalk animate-pulseLive" />
                Live
              </span>
            ) : (
              <span className="absolute left-4 top-4 rounded bg-ink/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-chalk">
                {listing.status === 'UPCOMING' ? 'Starts soon' : 'Ended'}
              </span>
            )}

            {listing.status !== 'LIVE' && (
              <div className="absolute inset-x-0 bottom-0 bg-ink/80 p-3 text-center font-mono text-[11px] text-chalk/70">
                Video streaming connects here via a provider like LiveKit or Mux —
                see the README for setup.
              </div>
            )}
          </div>

          <p className="mt-4 text-ink/70">{listing.description}</p>
        </div>

        {/* Bid + chat column */}
        <div className="flex flex-col gap-6">
          <div className="rounded border border-hairline/10 bg-white/50 p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-ink/50">
              {listing.status === 'ENDED' ? 'Sold for' : 'Current bid'}
            </p>
            <p className={`mt-1 font-display text-4xl text-ink ${justBid ? 'animate-bidFlash' : ''}`}>
              {formatPrice(currentPrice)}
            </p>

            {listing.status === 'LIVE' && (
              <div className="mt-4">
                <button
                  onClick={() => placeBid(nextBid)}
                  className="w-full rounded bg-hammer py-3 font-mono text-sm uppercase tracking-widest text-chalk hover:opacity-90 transition-opacity"
                >
                  Bid {formatPrice(nextBid)}
                </button>
                {bidError && <p className="mt-2 text-sm text-hammer">{bidError}</p>}
                {!session && (
                  <p className="mt-2 font-mono text-xs text-ink/50">
                    <a href="/login" className="underline">Sign in</a> to place a bid.
                  </p>
                )}
              </div>
            )}

            {listing.status === 'ENDED' && (
              <button
                onClick={handleCheckout}
                className="mt-4 w-full rounded bg-ink py-3 font-mono text-sm uppercase tracking-widest text-chalk hover:bg-hammer transition-colors"
              >
                Checkout
              </button>
            )}

            <div className="mt-5 max-h-40 space-y-1.5 overflow-y-auto border-t border-hairline/10 pt-3">
              {bids.length === 0 && <p className="font-mono text-xs text-ink/30">No bids yet.</p>}
              {bids.map((bid) => (
                <div key={bid.id} className="flex justify-between font-mono text-xs text-ink/60">
                  <span>{bid.userName}</span>
                  <span>{formatPrice(bid.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded border border-hairline/10 bg-white/50 p-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/50">Chat</p>
            <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 280 }}>
              {chat.map((msg) => (
                <p key={msg.id} className="text-sm text-ink/80">
                  <span className="font-mono text-xs text-ink/50">{msg.userName}: </span>
                  {msg.message}
                </p>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={session ? 'Say something…' : 'Sign in to chat'}
                disabled={!session}
                className="flex-1 rounded border border-hairline/20 bg-white px-3 py-2 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!session}
                className="rounded bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-chalk disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
