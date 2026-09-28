import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SellerReviewButtons from '@/components/SellerReviewButtons';

function isAdmin(email: string | undefined) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && list.includes(email.toLowerCase()));
}

export default async function AdminSellersPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    redirect('/');
  }

  const stores = await prisma.store.findMany({
    where: { sellerStatus: 'PENDING' },
    include: { seller: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink">Seller applications</h1>
      <p className="mt-1 text-sm text-ink/60">Review each application, then approve or reject.</p>

      <div className="mt-8 space-y-4">
        {stores.length === 0 && (
          <p className="font-mono text-sm text-ink/40">No pending applications.</p>
        )}
        {stores.map((store) => (
          <div key={store.id} className="rounded border border-hairline/10 bg-white/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg text-ink">{store.businessName || store.name}</p>
                <p className="font-mono text-xs text-ink/50">{store.seller.name} · {store.seller.email}</p>
              </div>
              <SellerReviewButtons storeId={store.id} />
            </div>
            <div className="mt-3 space-y-1 text-sm text-ink/70">
              <p><span className="font-mono text-xs uppercase tracking-widest text-ink/40">Sells: </span>{store.productCategory || 'Not provided'}</p>
              <p><span className="font-mono text-xs uppercase tracking-widest text-ink/40">Link: </span>{store.socialLink || 'Not provided'}</p>
              <p className="whitespace-pre-wrap"><span className="font-mono text-xs uppercase tracking-widest text-ink/40">About: </span>{store.pitch || 'Not provided'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
