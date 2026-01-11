import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

// basic logging for debugging
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  req.requestId = requestId;
  console.log(`[${requestId}] ${req.method} ${req.path}`);
  next();
});

// simple health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// check if user is authenticated
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
};

// check if user has the right role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
};

// auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// programs endpoints
app.get('/api/cms/programs', authenticate, requireRole('admin', 'editor', 'viewer'), async (req, res) => {
  try {
    const { status, language, topic } = req.query;
    const where = {};
    if (status) where.status = status;
    if (language) where.languagePrimary = language;
    
    let programs = await prisma.program.findMany({
      where,
      include: {
        topics: { include: { topic: true } },
        assets: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // filter by topic in memory (could optimize with db query but this works)
    if (topic) {
      programs = programs.filter(p => p.topics.some(pt => pt.topic.name === topic));
    }

    res.json(programs);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.get('/api/cms/programs/:id', authenticate, requireRole('admin', 'editor', 'viewer'), async (req, res) => {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: {
        topics: { include: { topic: true } },
        terms: {
          include: {
            lessons: {
              include: { assets: true },
              orderBy: { lessonNumber: 'asc' },
            },
          },
          orderBy: { termNumber: 'asc' },
        },
        assets: true,
      },
    });
    if (!program) return res.status(404).json({ code: 'NOT_FOUND', message: 'Program not found' });
    res.json(program);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.post('/api/cms/programs', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { title, description, languagePrimary, languagesAvailable, topicIds } = req.body;
    if (!languagesAvailable.includes(languagePrimary)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Primary language must be in available languages' });
    }
    const program = await prisma.program.create({
      data: {
        title,
        description,
        languagePrimary,
        languagesAvailable,
        topics: {
          create: topicIds?.map(topicId => ({ topicId })) || [],
        },
      },
      include: { topics: { include: { topic: true } } },
    });
    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.put('/api/cms/programs/:id', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { title, description, languagePrimary, languagesAvailable, topicIds } = req.body;
    if (languagesAvailable && !languagesAvailable.includes(languagePrimary)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Primary language must be in available languages' });
    }
    
    // handle topic updates - delete old ones and add new
    if (topicIds) {
      await prisma.programTopic.deleteMany({ where: { programId: req.params.id } });
      await prisma.programTopic.createMany({
        data: topicIds.map(topicId => ({ programId: req.params.id, topicId })),
      });
    }

    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: { title, description, languagePrimary, languagesAvailable },
      include: { topics: { include: { topic: true } }, assets: true },
    });
    res.json(program);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// program assets
app.post('/api/cms/programs/:id/assets', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { language, variant, assetType, url } = req.body;
    const asset = await prisma.programAsset.create({
      data: { programId: req.params.id, language, variant, assetType, url },
    });
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.delete('/api/cms/programs/:id/assets/:assetId', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    await prisma.programAsset.delete({ where: { id: req.params.assetId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// terms
app.post('/api/cms/programs/:id/terms', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { termNumber, title } = req.body;
    const term = await prisma.term.create({
      data: { programId: req.params.id, termNumber, title },
    });
    res.status(201).json(term);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// lessons
app.get('/api/cms/lessons/:id', authenticate, requireRole('admin', 'editor', 'viewer'), async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        term: { include: { program: true } },
        assets: true,
      },
    });
    if (!lesson) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.post('/api/cms/terms/:termId/lessons', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const {
      lessonNumber,
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage,
    } = req.body;
    
    if (!contentLanguagesAvailable.includes(contentLanguagePrimary)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Primary content language must be in available languages' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        termId: req.params.termId,
        lessonNumber,
        title,
        contentType,
        durationMs,
        isPaid,
        contentLanguagePrimary,
        contentLanguagesAvailable,
        contentUrlsByLanguage,
        subtitleLanguages: subtitleLanguages || [],
        subtitleUrlsByLanguage: subtitleUrlsByLanguage || {},
      },
    });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.put('/api/cms/lessons/:id', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const {
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage,
      status,
      publishAt,
    } = req.body;

    if (contentLanguagesAvailable && !contentLanguagesAvailable.includes(contentLanguagePrimary)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Primary content language must be in available languages' });
    }

    // if scheduling, need a publish date
    if (status === 'scheduled' && !publishAt) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'publishAt is required for scheduled status' });
    }

    const updateData = {
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage,
      status,
      publishAt,
    };

    // make sure published lessons have the required thumbnails
    if (status === 'published') {
      const lesson = await prisma.lesson.findUnique({
        where: { id: req.params.id },
        include: { assets: true },
      });
      const primaryAssets = lesson.assets.filter(a => a.language === lesson.contentLanguagePrimary);
      const hasPortrait = primaryAssets.some(a => a.variant === 'portrait' && a.assetType === 'thumbnail');
      const hasLandscape = primaryAssets.some(a => a.variant === 'landscape' && a.assetType === 'thumbnail');
      if (!hasPortrait || !hasLandscape) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Published lessons must have portrait and landscape thumbnails for primary language' });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: updateData,
      include: { assets: true },
    });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.post('/api/cms/lessons/:id/publish', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { assets: true, term: { include: { program: true } } },
    });

    if (!lesson) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });

    const primaryAssets = lesson.assets.filter(a => a.language === lesson.contentLanguagePrimary && a.assetType === 'thumbnail');
    const hasPortrait = primaryAssets.some(a => a.variant === 'portrait');
    const hasLandscape = primaryAssets.some(a => a.variant === 'landscape');
    
    if (!hasPortrait || !hasLandscape) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Published lessons must have portrait and landscape thumbnails for primary language' });
    }

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { status: 'published', publishedAt: new Date() },
    });

    // auto-publish the program when first lesson gets published
    if (lesson.term.program.status !== 'published') {
      await prisma.program.update({
        where: { id: lesson.term.programId },
        data: { status: 'published', publishedAt: new Date() },
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.post('/api/cms/lessons/:id/schedule', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { publishAt } = req.body;
    if (!publishAt) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'publishAt is required' });
    }
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { status: 'scheduled', publishAt: new Date(publishAt) },
    });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.post('/api/cms/lessons/:id/archive', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { status: 'archived' },
    });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// lesson assets
app.post('/api/cms/lessons/:id/assets', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { language, variant, assetType, url } = req.body;
    const asset = await prisma.lessonAsset.create({
      data: { lessonId: req.params.id, language, variant, assetType, url },
    });
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.delete('/api/cms/lessons/:id/assets/:assetId', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    await prisma.lessonAsset.delete({ where: { id: req.params.assetId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// topics
app.get('/api/cms/topics', authenticate, requireRole('admin', 'editor', 'viewer'), async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({ orderBy: { name: 'asc' } });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.post('/api/cms/topics', authenticate, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { name } = req.body;
    const topic = await prisma.topic.create({ data: { name } });
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// users (admin only)
app.get('/api/cms/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// public catalog API (no auth needed)
app.get('/catalog/programs', async (req, res) => {
  try {
    const { language, topic, cursor, limit = 20 } = req.query;
    const take = Math.min(parseInt(limit) || 20, 100);

    const where = {
      status: 'published',
      terms: {
        some: {
          lessons: {
            some: { status: 'published' },
          },
        },
      },
    };
    if (language) where.languagePrimary = language;

    const programs = await prisma.program.findMany({
      where,
      include: {
        topics: { include: { topic: true } },
        assets: true,
        terms: {
          include: {
            lessons: {
              where: { status: 'published' },
              include: { assets: true },
              orderBy: { lessonNumber: 'asc' },
            },
          },
          orderBy: { termNumber: 'asc' },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    // topic filtering happens in memory
    let filteredPrograms = programs;
    if (topic) {
      filteredPrograms = programs.filter(p => p.topics.some(pt => pt.topic.name === topic));
    }

    // transform assets into the format the frontend expects
    const transformed = filteredPrograms.map(p => ({
      ...p,
      assets: {
        posters: p.assets.reduce((acc, asset) => {
          if (!acc[asset.language]) acc[asset.language] = {};
          acc[asset.language][asset.variant] = asset.url;
          return acc;
        }, {}),
      },
      terms: p.terms.map(t => ({
        ...t,
        lessons: t.lessons.map(l => ({
          ...l,
          assets: {
            thumbnails: l.assets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {}),
          },
        })),
      })),
    }));

    const nextCursor = filteredPrograms.length === take ? filteredPrograms[filteredPrograms.length - 1].id : null;

    res.set('Cache-Control', 'public, max-age=300');
    res.json({ programs: transformed, nextCursor });
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.get('/catalog/programs/:id', async (req, res) => {
  try {
    const program = await prisma.program.findFirst({
      where: {
        id: req.params.id,
        status: 'published',
        terms: {
          some: {
            lessons: {
              some: { status: 'published' },
            },
          },
        },
      },
      include: {
        topics: { include: { topic: true } },
        assets: true,
        terms: {
          include: {
            lessons: {
              where: { status: 'published' },
              include: { assets: true },
              orderBy: { lessonNumber: 'asc' },
            },
          },
          orderBy: { termNumber: 'asc' },
        },
      },
    });

    if (!program) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Program not found' });
    }

    const transformed = {
      ...program,
      assets: {
        posters: program.assets.reduce((acc, asset) => {
          if (!acc[asset.language]) acc[asset.language] = {};
          acc[asset.language][asset.variant] = asset.url;
          return acc;
        }, {}),
      },
      terms: program.terms.map(t => ({
        ...t,
        lessons: t.lessons.map(l => ({
          ...l,
          assets: {
            thumbnails: l.assets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {}),
          },
        })),
      })),
    };

    res.set('Cache-Control', 'public, max-age=300');
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

app.get('/catalog/lessons/:id', async (req, res) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: req.params.id,
        status: 'published',
      },
      include: {
        term: {
          include: {
            program: {
              include: { assets: true },
            },
          },
        },
        assets: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });
    }

    const transformed = {
      ...lesson,
      assets: {
        thumbnails: lesson.assets.reduce((acc, asset) => {
          if (!acc[asset.language]) acc[asset.language] = {};
          acc[asset.language][asset.variant] = asset.url;
          return acc;
        }, {}),
      },
    };

    res.set('Cache-Control', 'public, max-age=300');
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

// catch all errors
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
