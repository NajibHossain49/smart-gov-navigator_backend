import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Seed Roles ─────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { role_name: 'Admin' },
    update: {},
    create: { role_name: 'Admin', description: 'System administrator with full access' },
  });

  const userRole = await prisma.role.upsert({
    where: { role_name: 'User' },
    update: {},
    create: { role_name: 'User', description: 'Regular user with limited access' },
  });

  console.log('✅ Roles seeded:', adminRole.role_name, userRole.role_name);

  // ── Seed Admin User ────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123456', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@govnavigator.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@govnavigator.com',
      password_hash: hashedPassword,
      role_id: adminRole.id,
    },
  });

  console.log('✅ Admin user seeded:', adminUser.email);

  // ── Seed Service Categories ────────────────────────────
  const categories = [
    { name: 'Identity Services', description: 'NID, passport, birth certificate and identity-related services' },
    { name: 'Business Services', description: 'Trade license, company registration and business-related services' },
    { name: 'Land Services', description: 'Land registration, mutation and land-related services' },
    { name: 'Education Services', description: 'Certificate attestation, scholarship and education-related services' },
    { name: 'Social Services', description: 'Social welfare, allowances and support services' },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Service categories seeded:', categories.length);

  // ── Seed Sample Service ────────────────────────────────
  const identityCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Identity Services' },
  });

  if (identityCategory) {
    const passportService = await prisma.service.upsert({
      where: { id: 1 },
      update: {},
      create: {
        category_id: identityCategory.id,
        title: 'Passport Application',
        description: 'Apply for a new Bangladeshi passport or renew an existing one.',
        application_process: 'Apply online through the DIP website, pay the fee, and attend biometric verification.',
        fees: 'BDT 3,000 - 6,900 depending on delivery type',
        processing_time: '21 working days (regular), 7 working days (urgent)',
      },
    });

    // Steps for passport
    const steps = [
      { step_number: 1, step_title: 'Online Registration', step_description: 'Visit www.dip.gov.bd and complete the online application form.' },
      { step_number: 2, step_title: 'Fee Payment', step_description: 'Pay the passport fee through designated banks or mobile banking.' },
      { step_number: 3, step_title: 'Biometric Enrollment', step_description: 'Visit the passport office for fingerprint and photo capture.' },
      { step_number: 4, step_title: 'Document Submission', step_description: 'Submit all required documents at the counter.' },
      { step_number: 5, step_title: 'Passport Collection', step_description: 'Collect your passport after receiving the SMS notification.' },
    ];

    for (const step of steps) {
      await prisma.serviceStep.upsert({
        where: { id: step.step_number },
        update: {},
        create: { service_id: passportService.id, ...step },
      });
    }

    // Required documents for passport
    const docs = [
      { document_name: 'National ID Card (NID)', description: 'Original and photocopy of your National ID Card' },
      { document_name: 'Birth Certificate', description: 'Online birth certificate issued by government' },
      { document_name: 'Passport Size Photo', description: '2 copies of recent passport size photos with white background' },
      { document_name: 'Bank Payment Receipt', description: 'Proof of fee payment from designated bank' },
    ];

    for (const doc of docs) {
      const exists = await prisma.requiredDocument.findFirst({
        where: { service_id: passportService.id, document_name: doc.document_name },
      });
      if (!exists) {
        await prisma.requiredDocument.create({ data: { service_id: passportService.id, ...doc } });
      }
    }

    console.log('✅ Sample passport service seeded with steps and documents');
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('📧 Admin login: admin@govnavigator.com');
  console.log('🔑 Admin password: admin123456');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
