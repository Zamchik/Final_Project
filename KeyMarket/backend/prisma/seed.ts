import 'dotenv/config';
import { prisma } from '../src/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  // 1. Пользователи
  const admin = await prisma.user.upsert({
    where: { email: 'admin@keymarket.local' },
    update: {},
    create: {
      email: 'admin@keymarket.local',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      verifiedAt: new Date(),
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@keymarket.local' },
    update: {},
    create: {
      email: 'seller@keymarket.local',
      passwordHash: hashPassword('seller123'),
      role: 'SELLER',
      verifiedAt: new Date(),
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@keymarket.local' },
    update: {},
    create: {
      email: 'buyer@keymarket.local',
      passwordHash: hashPassword('buyer123'),
      role: 'BUYER',
      verifiedAt: new Date(),
    },
  });

  // 2. Категории
  const categoryNames = [
    'Экшен', 'Приключения', 'RPG', 'Стратегии', 'Симуляторы',
    'Спорт', 'Гонки', 'Хоррор', 'Головоломки', 'Файтинги',
  ];

  const categories = await Promise.all(
    categoryNames.map(name =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name, slug: name.toLowerCase() },
      })
    )
  );

  // 3. Товары (хотя бы один, чтобы каталог не был пустым)
  await prisma.product.create({
    data: {
      sellerId: seller.id,
      categoryId: categories[0].id,
      title: 'Cyberpunk 2077',
      description: 'Ролевая игра в открытом мире.',
      price: 1999,
      stock: 2,
      productType: 'GAME',
      keys: {
        create: [
          { keyValue: 'CP77-XXXXX-XXXXX-XXXXX' },
          { keyValue: 'CP77-YYYYY-YYYYY-YYYYY' },
        ],
      },
    },
  });

  console.log('✅ Seed completed: test accounts and sample product created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });