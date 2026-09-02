// Custom server so we can attach Socket.io alongside Next.js.
// Handles two real-time features per listing "room":
//   - bid:new       client -> server, a buyer places a bid
//   - bid:accepted   server -> room, broadcast the new high bid
//   - chat:send      client -> server, a chat message
//   - chat:new       server -> room, broadcast the message
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    socket.on('room:join', ({ listingId }) => {
      socket.join(listingId);
    });

    socket.on('bid:new', async ({ listingId, userId, userName, amount }) => {
      try {
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing || listing.status !== 'LIVE') {
          socket.emit('bid:rejected', { reason: 'This listing is not live.' });
          return;
        }
        if (amount < listing.currentPrice + listing.bidIncrement) {
          socket.emit('bid:rejected', {
            reason: `Bid must be at least $${((listing.currentPrice + listing.bidIncrement) / 100).toFixed(2)}`,
          });
          return;
        }

        const bid = await prisma.bid.create({
          data: { listingId, userId, amount },
        });
        await prisma.listing.update({
          where: { id: listingId },
          data: { currentPrice: amount },
        });

        io.to(listingId).emit('bid:accepted', {
          id: bid.id,
          userName,
          amount,
          createdAt: bid.createdAt,
        });
      } catch (err) {
        console.error('bid:new error', err);
        socket.emit('bid:rejected', { reason: 'Something went wrong placing that bid.' });
      }
    });

    socket.on('chat:send', async ({ listingId, userId, userName, message }) => {
      try {
        const trimmed = (message || '').slice(0, 300).trim();
        if (!trimmed) return;
        const chatMessage = await prisma.chatMessage.create({
          data: { listingId, userId, message: trimmed },
        });
        io.to(listingId).emit('chat:new', {
          id: chatMessage.id,
          userName,
          message: trimmed,
          createdAt: chatMessage.createdAt,
        });
      } catch (err) {
        console.error('chat:send error', err);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
