'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SessionPayload } from '@/lib/auth';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  LocalVideoTrack,
  createLocalTracks,
} from 'livekit-client';

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
  isSeller,
}: {
  listing: Listing;
  initialBids: BidEvent[];
  initialChat: ChatEvent[];
  session: SessionPayload | null;
  isSeller: boolean;
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

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const [videoConnected, setVideoConnected] = useState(false);
  const [videoLive, setVideoLive] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (listing.status !== 'LIVE') return;

    let mounted = true;
    let room: Room | null = null;

    async function connectVideo() {
      try {
        const identity = isSeller
          ? `seller-${listing.id}`
          : `viewer-${listing.id}-${Math.random().toString(36).slice(2, 8)}`;

        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: listing.id }),
        });

        if (!res.ok) {
          throw new Error('Failed to get streaming token');
        }

        const { token, url } = await res.json();

        room = new Room({ adaptiveStream: true, dynacast: true });
        livekitRoomRef.current = room;

        room
          .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, _participant: RemoteParticipant) => {
            const el = track.attach();
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.objectFit = 'cover';
            videoContainerRef.current?.appendChild(el);
            if (track.kind === Track.Kind.Video) setVideoLive(true);
          })
          .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            track.detach().forEach((el) => el.remove());
          })
          .on(RoomEvent.ParticipantDisconnected, () => setVideoLive(false))
          .on(RoomEvent.Disconnected, () => {
            if (mounted) setVideoConnected(false);
          });

        await room.connect(url, token);
        if (!mounted) {
          room.disconnect();
          return;
        }
        setVideoConnected(true);

        if (isSeller) {
          const tracks = await createLocalTracks({ audio: true, video: true });
          let foundVideo = false;
          for (const track of tracks) {
            await room.localParticipant.publishTrack(track);
            if (track.kind === Track.Kind.Video) {
              const el = (track as LocalVideoTrack).attach();
              el.style.width = '100%';
              el.style.height = '100%';
              el.style.objectFit = 'cover';
              videoContainerRef.current?.appendChild(el);
              foundVideo = true;
            }
          }
          if (foundVideo) {
            setVideoLive(true);
          } else {
            setVideoError('No camera detected on this device. Connect a webcam and reload to go live.');
          }
        }
      } catch (err) {
        console.error('LiveKit connection error:', err);
        if (mounted) {
          setVideoError(err instanceof Error ? err.message : 'Failed to connect to stream');
        }
      }
    }

    connectVideo();

    return () => {
      mounted = false;
      room?.disconnect();
      livekitRoomRef.current = null;
    };
  }, [listing.id, listing.status, isSeller]);

  const nextBid = currentPrice + listing.bidIncrement;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="font-mono text-xs uppercase tracking-widest text-ink/40">
        <a href={`/store/${listing.storeSlug}`} className="hover:text-hammer">{listing.storeName}</a>
      </p>
      <h1 className="mt-1 font-display text-3xl text-ink">{listing.title}</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded bg-ink">
            {listing.status === 'LIVE' ? (
              <>
                <div ref={videoContainerRef} className="h-full w-full flex items-center justify-center" />
                {!videoLive && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center text-chalk/70 bg-ink/60 text-sm font-mono text-center px-4">
                    {isSeller ? 'Starting your camera…' : 'Waiting for the seller to go live…'}
                  </div>
                )}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center text-hammer bg-ink/80 text-sm font-mono text-center px-4">
                    {videoError}
                  </div>
                )}
              </>
            ) : listing.imageUrl ? (
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
              <span className="absolute left-4 top-4 rounded bg-ink/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-chalk/70">
                {listing.status === 'UPCOMING' ? 'Starts soon' : 'Ended'}
              </span>
            )}
          </div>

          <p className="mt-4 text-ink/70">{listing.description}</p>
        </div>

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
                  className="w-full rounded bg-hammer py-3 font-mono text-sm uppercase tracking-widest text-chalk hover:opacity-90"
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
                className="mt-4 w-full rounded bg-ink py-3 font-mono text-sm uppercase tracking-widest text-chalk hover:bg-ink/90"
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
