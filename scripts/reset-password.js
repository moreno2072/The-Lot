const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'lexi@gmail.com';
  const newPassword = 'TempPass12345';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('No user found for ' + email);
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
  console.log('Password reset for ' + email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
