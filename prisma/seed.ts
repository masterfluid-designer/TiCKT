import { PrismaClient, UserRole, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Organisation demo ───────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Events',
      slug: 'demo-org',
      email: 'contact@demo-events.com',
      phone: '+22990000000',
      logoUrl: null,
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ── Admin user ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  const admin = await prisma.user.upsert({
    where: { id: 'seed-admin-001' },
    update: {},
    create: {
      id: 'seed-admin-001',
      organizationId: org.id,
      email: 'admin@demo-events.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Demo',
      phone: '+22991000000',
      role: UserRole.ORG_ADMIN,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Agent de scan ───────────────────────────────────────────────────────
  const agentHash = await bcrypt.hash('Agent1234!', 12);

  const agent = await prisma.user.upsert({
    where: { id: 'seed-agent-001' },
    update: {},
    create: {
      id: 'seed-agent-001',
      organizationId: org.id,
      email: 'agent@demo-events.com',
      passwordHash: agentHash,
      firstName: 'Agent',
      lastName: 'Scanner',
      phone: '+22992000000',
      role: UserRole.ORG_AGENT,
    },
  });
  console.log(`✅ Agent: ${agent.email}`);

  // ── Événement publié ────────────────────────────────────────────────────
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 30);

  const event = await prisma.event.upsert({
    where: { id: 'seed-event-001' },
    update: {},
    create: {
      id: 'seed-event-001',
      organizationId: org.id,
      name: 'AfroTech Summit 2026',
      slug: 'afrotech-summit-2026',
      description: 'Le plus grand événement tech d\'Afrique de l\'Ouest. Conférences, ateliers, networking.',
      location: 'Palais des Congrès',
      address: 'Cotonou, Bénin',
      eventDate,
      status: EventStatus.PUBLISHED,
      primaryColor: '#6C63FF',
      secondaryColor: '#FF6584',
      maxCapacity: 500,
      isPublic: true,
    },
  });
  console.log(`✅ Event: ${event.name}`);

  // ── Catégories de tickets ───────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.ticketCategory.upsert({
      where: { id: 'seed-cat-001' },
      update: {},
      create: {
        id: 'seed-cat-001',
        eventId: event.id,
        name: 'Standard',
        description: 'Accès général à l\'événement',
        price: 5000,
        currency: 'XOF',
        quantity: 300,
        remaining: 300,
        sortOrder: 1,
      },
    }),
    prisma.ticketCategory.upsert({
      where: { id: 'seed-cat-002' },
      update: {},
      create: {
        id: 'seed-cat-002',
        eventId: event.id,
        name: 'VIP',
        description: 'Accès prioritaire + cocktail dînatoire',
        price: 15000,
        currency: 'XOF',
        quantity: 100,
        remaining: 100,
        sortOrder: 2,
      },
    }),
    prisma.ticketCategory.upsert({
      where: { id: 'seed-cat-003' },
      update: {},
      create: {
        id: 'seed-cat-003',
        eventId: event.id,
        name: 'Speaker',
        description: 'Pass conférencier - Entrée gratuite',
        price: 0,
        currency: 'XOF',
        quantity: 50,
        remaining: 50,
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`✅ ${categories.length} catégories créées`);

  console.log('\n🎉 Seed terminé !\n');
  console.log('─────────────────────────────────');
  console.log('Identifiants de connexion :');
  console.log(`  Admin  → admin@demo-events.com / Admin1234!`);
  console.log(`  Agent  → agent@demo-events.com / Agent1234!`);
  console.log(`  Event  → /events/afrotech-summit-2026`);
  console.log('─────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
