import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function publishScheduledLessons() {
  try {
    console.log('[Worker] Checking for scheduled lessons...');
    
    const now = new Date();
    
    // using row-level locking so multiple workers don't step on each other
    const lessons = await prisma.$queryRaw`
      SELECT id, "termId", "publishAt"
      FROM "Lesson"
      WHERE status = 'scheduled'
        AND "publishAt" IS NOT NULL
        AND "publishAt" <= ${now}
      FOR UPDATE SKIP LOCKED
    `;

    if (lessons.length === 0) {
      console.log('[Worker] No scheduled lessons to publish');
      return;
    }

    console.log(`[Worker] Found ${lessons.length} lesson(s) to publish`);

    for (const lesson of lessons) {
      await prisma.$transaction(async (tx) => {
        // double check status hasn't changed (make it idempotent)
        const current = await tx.lesson.findUnique({
          where: { id: lesson.id },
          include: { term: { include: { program: true } } },
        });

        if (!current || current.status !== 'scheduled') {
          console.log(`[Worker] Lesson ${lesson.id} already processed, skipping`);
          return;
        }

        // need to check assets before we publish
        const assets = await tx.lessonAsset.findMany({
          where: { lessonId: lesson.id },
        });

        const primaryAssets = assets.filter(
          a => a.language === current.contentLanguagePrimary && a.assetType === 'thumbnail'
        );
        const hasPortrait = primaryAssets.some(a => a.variant === 'portrait');
        const hasLandscape = primaryAssets.some(a => a.variant === 'landscape');

        if (!hasPortrait || !hasLandscape) {
          console.log(`[Worker] Lesson ${lesson.id} missing required assets, skipping`);
          return;
        }

        // update to published, but only if still scheduled (idempotency)
        const updated = await tx.lesson.updateMany({
          where: {
            id: lesson.id,
            status: 'scheduled',
          },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });

        if (updated.count === 0) {
          console.log(`[Worker] Lesson ${lesson.id} was already published, skipping`);
          return;
        }

        console.log(`[Worker] Published lesson ${lesson.id}`);

        // auto-publish the program too if it's not already published
        if (current.term.program.status !== 'published') {
          await tx.program.updateMany({
            where: {
              id: current.term.programId,
              status: { not: 'published' },
            },
            data: {
              status: 'published',
              publishedAt: new Date(),
            },
          });
          console.log(`[Worker] Auto-published program ${current.term.programId}`);
        }
      });
    }

    console.log('[Worker] Publishing batch complete');
  } catch (error) {
    console.error('[Worker] Error:', error);
  }
}

// runs every minute
async function run() {
  console.log('[Worker] Starting worker...');
  await publishScheduledLessons();
  
  // schedule next run
  setTimeout(run, 60 * 1000);
}

// start it up
run().catch(console.error);

// handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
