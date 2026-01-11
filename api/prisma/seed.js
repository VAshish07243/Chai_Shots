import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // create default users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      password: bcrypt.hashSync('editor123', 10),
      role: 'editor',
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      password: bcrypt.hashSync('viewer123', 10),
      role: 'viewer',
    },
  });

  console.log('Created users:', { admin: adminUser.email, editor: editorUser.email, viewer: viewerUser.email });

  // create some topics
  const topic1 = await prisma.topic.upsert({
    where: { name: 'Technology' },
    update: {},
    create: { name: 'Technology' },
  });

  const topic2 = await prisma.topic.upsert({
    where: { name: 'Education' },
    update: {},
    create: { name: 'Education' },
  });

  const topic3 = await prisma.topic.upsert({
    where: { name: 'Health' },
    update: {},
    create: { name: 'Health' },
  });

  console.log('Created topics');

  // first program - telugu learning with english support
  const program1 = await prisma.program.create({
    data: {
      title: 'Telugu Language Learning',
      description: 'Complete course to learn Telugu language',
      languagePrimary: 'Telugu',
      languagesAvailable: ['Telugu', 'English'],
      status: 'published',
      publishedAt: new Date(),
      topics: {
        create: [{ topicId: topic2.id }, { topicId: topic1.id }],
      },
    },
  });

  // add posters for program 1
  await prisma.programAsset.createMany({
    data: [
      { programId: program1.id, language: 'Telugu', variant: 'portrait', assetType: 'poster', url: 'https://via.placeholder.com/300x400?text=Telugu+Portrait' },
      { programId: program1.id, language: 'Telugu', variant: 'landscape', assetType: 'poster', url: 'https://via.placeholder.com/600x300?text=Telugu+Landscape' },
      { programId: program1.id, language: 'English', variant: 'portrait', assetType: 'poster', url: 'https://via.placeholder.com/300x400?text=English+Portrait' },
      { programId: program1.id, language: 'English', variant: 'landscape', assetType: 'poster', url: 'https://via.placeholder.com/600x300?text=English+Landscape' },
    ],
  });

  // first term
  const term1 = await prisma.term.create({
    data: {
      programId: program1.id,
      termNumber: 1,
      title: 'Basics',
    },
  });

  // create some lessons for term 1
  const lesson1 = await prisma.lesson.create({
    data: {
      termId: term1.id,
      lessonNumber: 1,
      title: 'Introduction to Telugu',
      contentType: 'video',
      durationMs: 300000,
      isPaid: false,
      contentLanguagePrimary: 'Telugu',
      contentLanguagesAvailable: ['Telugu', 'English'],
      contentUrlsByLanguage: {
        Telugu: 'https://example.com/video/telugu/intro.mp4',
        English: 'https://example.com/video/english/intro.mp4',
      },
      subtitleLanguages: ['Telugu', 'English'],
      subtitleUrlsByLanguage: {
        Telugu: 'https://example.com/subtitles/telugu/intro.vtt',
        English: 'https://example.com/subtitles/english/intro.vtt',
      },
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.lessonAsset.createMany({
    data: [
      { lessonId: lesson1.id, language: 'Telugu', variant: 'portrait', assetType: 'thumbnail', url: 'https://via.placeholder.com/300x400?text=Lesson+1+Portrait' },
      { lessonId: lesson1.id, language: 'Telugu', variant: 'landscape', assetType: 'thumbnail', url: 'https://via.placeholder.com/600x300?text=Lesson+1+Landscape' },
    ],
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      termId: term1.id,
      lessonNumber: 2,
      title: 'Telugu Alphabets',
      contentType: 'video',
      durationMs: 420000,
      isPaid: true,
      contentLanguagePrimary: 'Telugu',
      contentLanguagesAvailable: ['Telugu'],
      contentUrlsByLanguage: {
        Telugu: 'https://example.com/video/telugu/alphabets.mp4',
      },
      subtitleLanguages: ['Telugu'],
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.lessonAsset.createMany({
    data: [
      { lessonId: lesson2.id, language: 'Telugu', variant: 'portrait', assetType: 'thumbnail', url: 'https://via.placeholder.com/300x400?text=Lesson+2+Portrait' },
      { lessonId: lesson2.id, language: 'Telugu', variant: 'landscape', assetType: 'thumbnail', url: 'https://via.placeholder.com/600x300?text=Lesson+2+Landscape' },
    ],
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      termId: term1.id,
      lessonNumber: 3,
      title: 'Basic Grammar',
      contentType: 'article',
      isPaid: false,
      contentLanguagePrimary: 'Telugu',
      contentLanguagesAvailable: ['Telugu', 'English'],
      contentUrlsByLanguage: {
        Telugu: 'https://example.com/article/telugu/grammar.html',
        English: 'https://example.com/article/english/grammar.html',
      },
      subtitleLanguages: [],
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.lessonAsset.createMany({
    data: [
      { lessonId: lesson3.id, language: 'Telugu', variant: 'portrait', assetType: 'thumbnail', url: 'https://via.placeholder.com/300x400?text=Lesson+3+Portrait' },
      { lessonId: lesson3.id, language: 'Telugu', variant: 'landscape', assetType: 'thumbnail', url: 'https://via.placeholder.com/600x300?text=Lesson+3+Landscape' },
    ],
  });

  // one scheduled lesson to test the worker (publishes in 2 minutes)
  const publishAt = new Date();
  publishAt.setMinutes(publishAt.getMinutes() + 2);

  const lesson4 = await prisma.lesson.create({
    data: {
      termId: term1.id,
      lessonNumber: 4,
      title: 'Common Phrases',
      contentType: 'video',
      durationMs: 360000,
      isPaid: false,
      contentLanguagePrimary: 'Telugu',
      contentLanguagesAvailable: ['Telugu'],
      contentUrlsByLanguage: {
        Telugu: 'https://example.com/video/telugu/phrases.mp4',
      },
      subtitleLanguages: ['Telugu'],
      status: 'scheduled',
      publishAt: publishAt,
    },
  });

  await prisma.lessonAsset.createMany({
    data: [
      { lessonId: lesson4.id, language: 'Telugu', variant: 'portrait', assetType: 'thumbnail', url: 'https://via.placeholder.com/300x400?text=Lesson+4+Portrait' },
      { lessonId: lesson4.id, language: 'Telugu', variant: 'landscape', assetType: 'thumbnail', url: 'https://via.placeholder.com/600x300?text=Lesson+4+Landscape' },
    ],
  });

  // second program - hindi learning
  const program2 = await prisma.program.create({
    data: {
      title: 'Hindi Learning Program',
      description: 'Learn Hindi from scratch',
      languagePrimary: 'Hindi',
      languagesAvailable: ['Hindi'],
      status: 'published',
      publishedAt: new Date(),
      topics: {
        create: [{ topicId: topic2.id }],
      },
    },
  });

  // posters for program 2
  await prisma.programAsset.createMany({
    data: [
      { programId: program2.id, language: 'Hindi', variant: 'portrait', assetType: 'poster', url: 'https://via.placeholder.com/300x400?text=Hindi+Portrait' },
      { programId: program2.id, language: 'Hindi', variant: 'landscape', assetType: 'poster', url: 'https://via.placeholder.com/600x300?text=Hindi+Landscape' },
    ],
  });

  // first term for program 2
  const term2 = await prisma.term.create({
    data: {
      programId: program2.id,
      termNumber: 1,
      title: 'Introduction',
    },
  });

  // lessons for term 2
  const lesson5 = await prisma.lesson.create({
    data: {
      termId: term2.id,
      lessonNumber: 1,
      title: 'Hindi Basics',
      contentType: 'video',
      durationMs: 280000,
      isPaid: false,
      contentLanguagePrimary: 'Hindi',
      contentLanguagesAvailable: ['Hindi'],
      contentUrlsByLanguage: {
        Hindi: 'https://example.com/video/hindi/basics.mp4',
      },
      subtitleLanguages: [],
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.lessonAsset.createMany({
    data: [
      { lessonId: lesson5.id, language: 'Hindi', variant: 'portrait', assetType: 'thumbnail', url: 'https://via.placeholder.com/300x400?text=Lesson+5+Portrait' },
      { lessonId: lesson5.id, language: 'Hindi', variant: 'landscape', assetType: 'thumbnail', url: 'https://via.placeholder.com/600x300?text=Lesson+5+Landscape' },
    ],
  });

  const lesson6 = await prisma.lesson.create({
    data: {
      termId: term2.id,
      lessonNumber: 2,
      title: 'Hindi Vocabulary',
      contentType: 'article',
      isPaid: true,
      contentLanguagePrimary: 'Hindi',
      contentLanguagesAvailable: ['Hindi'],
      contentUrlsByLanguage: {
        Hindi: 'https://example.com/article/hindi/vocabulary.html',
      },
      subtitleLanguages: [],
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.lessonAsset.createMany({
    data: [
      { lessonId: lesson6.id, language: 'Hindi', variant: 'portrait', assetType: 'thumbnail', url: 'https://via.placeholder.com/300x400?text=Lesson+6+Portrait' },
      { lessonId: lesson6.id, language: 'Hindi', variant: 'landscape', assetType: 'thumbnail', url: 'https://via.placeholder.com/600x300?text=Lesson+6+Landscape' },
    ],
  });

  console.log('Seeding complete!');
  console.log('Users:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Editor: editor@example.com / editor123');
  console.log('Programs created: 2');
  console.log('Terms created: 2');
  console.log('Lessons created: 6 (1 scheduled for demo)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
