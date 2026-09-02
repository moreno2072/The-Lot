// Seeds the database with a demo seller, store, and a few listings so the
// site isn't empty on first run. Run with: npm run db:seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const seller = await prisma.user.upsert({
    where: { email: 'seller@demo.com' },
    update: {},
    create: {
      email: 'seller@demo.com',
      passwordHash,
      name: 'Rosewood Cards',
      role: 'SELLER',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      email: 'buyer@demo.com',
      passwordHash,
      name: 'Jamie Buyer',
      role: 'BUYER',
    },
  });

  const store = await prisma.store.upsert({
    where: { sellerId: seller.id },
    update: {},
    create: {
      name: 'Rosewood Cards',
      slug: 'rosewood-cards',
      description: 'Vintage sports cards, graded and raw. Live breaks every Friday.',
      sellerId: seller.id,
    },
  });

  const listingsData = [
    {
      title: '1998 Refractor RC — PSA 9',
      description: 'Rookie refractor, centering is clean, corners sharp.',
      startingPrice: 4500,
      currentPrice: 4500,
      status: 'LIVE',
    },
    {
      title: 'Mystery Pack — 5 Vintage Cards',
      description: 'Unsearched vintage mystery pack, minimum one graded card.',
      startingPrice: 2000,
      currentPrice: 2000,
      status: 'UPCOMING',
    },
    {
      title: '2003 Rookie Patch Auto /99',
      description: 'On-card auto, patch is two-color, low pop.',
      startingPrice: 8000,
      currentPrice: 8000,
      status: 'ENDED',
    },
  ];

  for (const data of listingsData) {
    const existing = await prisma.listing.findFirst({ where: { title: data.title } });
    if (!existing) {
      await prisma.listing.create({
        data: { ...data, storeId: store.id },
      });
    }
  }

  console.log('Seed complete. Demo accounts:');
  console.log('  seller@demo.com / password123');
  console.log('  buyer@demo.com  / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
