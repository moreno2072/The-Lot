'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  LocalVideoTrack,
  createLocalTracks,
} from 'livekit-client';

interface ListingRoomProps {
  listingId: string;
  isSeller: boolean;
}

export default function ListingRoom({ listingId, isSeller }: ListingRoomProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    let room: Room | null = null;

    async function connect() {
      try {
        const identity = isSeller
          ? `seller-${listingId}`
          : `viewer-${listingId}-${Math.random().toString(36).slice(2, 8)}`;

        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: listingId, identity, isSeller }),
        });

        if (!res.ok) {
          throw new Error('Failed to get streaming token');
        }

        const { token, url } = await res.json();

        room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room
          .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, _participant: RemoteParticipant) => {
            const el = track.attach();
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.objectFit = 'cover';
            videoContainerRef.current?.appendChild(el);
            if (track.kind === Track.Kind.Video) setIsLive(true);
          })
          .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            track.detach().forEach((el) => el.remove());
          })
          .on(RoomEvent.ParticipantDisconnected, () => setIsLive(false))
          .on(RoomEvent.Disconnected, () => {
            if (mounted) setConnected(false);
          });

        await room.connect(url, token);
        if (!mounted) {
          room.disconnect();
          return;
        }
        setConnected(true);

        if (isSeller) {
          const tracks = await createLocalTracks({ audio: true, video: true });
          for (const track of tracks) {
            await room.localParticipant.publishTrack(track);
            if (track.kind === Track.Kind.Video) {
              const el = (track as LocalVideoTrack).attach();
              el.style.width = '100%';
              el.style.height = '100%';
              el.style.objectFit = 'cover';
              videoContainerRef.current?.appendChild(el);
            }
          }
          setIsLive(true);
        }
      } catch (err) {
        console.error('LiveKit connection error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to connect to stream');
        }
      }
    }

    connect();

    return () => {
      mounted = false;
      room?.disconnect();
      roomRef.current = null;
    };
  }, [listingId, isSeller]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={videoContainerRef} className="w-full h-full flex items-center justify-center" />
      {!isLive && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/60">
          <p>{isSeller ? 'Starting your camera…' : 'Waiting for the seller to go live…'}</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 bg-black/80 px-4 text-center">
          <p>{error}</p>
        </div>
      )}
      {connected && isLive && (
        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
          LIVE
        </span>
      )}
    </div>
  );
}
