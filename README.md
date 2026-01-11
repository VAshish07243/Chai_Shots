# CMS - Content Management System

A full-stack CMS application for managing **Programs → Terms → Lessons** with scheduled publishing and a public catalog API.

## Architecture

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│   Web   │────▶│   API   │────▶│   DB    │
│ (React) │     │(Express)│     │(Postgres)│
└─────────┘     └─────────┘     └─────────┘
                        ▲
                        │
                  ┌─────────┐
                  │ Worker  │
                  │ (Cron)  │
                  └─────────┘
```

### Components

- **Web (Frontend)**: React-based CMS interface for managing content
- **API (Backend)**: Express.js REST API with authentication and authorization
- **Worker**: Background job processor for scheduled lesson publishing
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Deployment**: Docker Compose

## Local Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (optional, if not using Docker)

### Quick Start with Docker

1. **Clone the repository**

```bash
cd Chai_Shorts
```

2. **Start all services**

```bash
docker compose up --build
```

This will start:
- PostgreSQL database on port 5432
- API server on port 3001
- Web app on port 3000
- Worker process (runs every minute)

3. **Run migrations and seed data**

In a new terminal, connect to the API container:

```bash
docker compose exec api npx prisma migrate dev --name init
docker compose exec api npm run prisma:seed
```

Or run migrations directly:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api node prisma/seed.js
```

4. **Access the application**

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

### Local Development (Without Docker)

1. **Start PostgreSQL**

Make sure PostgreSQL is running locally or use Docker:

```bash
docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=cms_user -e POSTGRES_PASSWORD=cms_password -e POSTGRES_DB=cms_db postgres:15-alpine
```

2. **Set up API**

```bash
cd api
npm install
cp .env.example .env  # Edit .env with your DATABASE_URL
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

3. **Set up Worker**

```bash
cd worker
npm install
# Copy prisma folder from api/prisma
cp -r ../api/prisma .
npm run dev
```

4. **Set up Web**

```bash
cd web
npm install
npm run dev
```

## Database Migrations

Migrations are managed by Prisma. To create a new migration:

```bash
cd api
npx prisma migrate dev --name migration_name
```

To apply migrations in production:

```bash
npx prisma migrate deploy
```

Migrations are stored in `api/prisma/migrations/`.

## Seed Data

The seed script creates sample data for testing:

- 2 Programs (Telugu and Hindi learning)
- 2 Terms total
- 6 Lessons total
- Multi-language examples
- Required assets (posters and thumbnails)
- 1 scheduled lesson (publishes in 2 minutes for demo)

Run the seed script:

```bash
cd api
npm run prisma:seed
```

Or:

```bash
node prisma/seed.js
```

## Default Users

- **Admin**: `admin@example.com` / `admin123`
- **Editor**: `editor@example.com` / `editor123`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### CMS Endpoints (requires authentication)

- `GET /api/cms/programs` - List programs
- `GET /api/cms/programs/:id` - Get program details
- `POST /api/cms/programs` - Create program (admin/editor)
- `PUT /api/cms/programs/:id` - Update program (admin/editor)
- `POST /api/cms/programs/:id/assets` - Add program asset (admin/editor)
- `POST /api/cms/programs/:id/terms` - Create term (admin/editor)
- `GET /api/cms/lessons/:id` - Get lesson details
- `POST /api/cms/terms/:termId/lessons` - Create lesson (admin/editor)
- `PUT /api/cms/lessons/:id` - Update lesson (admin/editor)
- `POST /api/cms/lessons/:id/publish` - Publish lesson (admin/editor)
- `POST /api/cms/lessons/:id/schedule` - Schedule lesson (admin/editor)
- `POST /api/cms/lessons/:id/archive` - Archive lesson (admin/editor)
- `POST /api/cms/lessons/:id/assets` - Add lesson asset (admin/editor)
- `GET /api/cms/topics` - List topics
- `POST /api/cms/topics` - Create topic (admin/editor)

### Public Catalog API (no authentication)

- `GET /catalog/programs` - List published programs
  - Query params: `language`, `topic`, `cursor`, `limit`
- `GET /catalog/programs/:id` - Get published program details
- `GET /catalog/lessons/:id` - Get published lesson details

### Health Check

- `GET /health` - Health check endpoint

## Worker Process

The worker runs every minute and:

1. Finds lessons with `status='scheduled'` and `publish_at <= now()`
2. Publishes them in a transaction:
   - Sets `status='published'`
   - Sets `published_at=now()`
3. Auto-publishes programs when they get their first published lesson

The worker is **idempotent** and **concurrency-safe** using row-level locking.

## Demo Flow

1. **Login as Editor**
   - Navigate to http://localhost:3000
   - Login with `editor@example.com` / `editor123`

2. **View Programs**
   - See the list of programs with filters
   - Click on a program to view details

3. **Create/Edit Lesson**
   - Navigate to a program
   - Create a new term if needed
   - Create a lesson or edit an existing one
   - Add thumbnails (portrait and landscape for primary language)
   - Schedule the lesson for publishing

4. **Wait for Worker**
   - The worker runs every minute
   - Check the lesson status - it should change to "published" when the scheduled time arrives

5. **Verify in Public Catalog**
   - Call `GET /catalog/programs` (no auth required)
   - The published lesson should appear in the catalog

## Deployment

### Environment Variables

**API** (`api/.env`):
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=production
```

**Worker** (`worker/.env`):
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
```

**Web** (build-time):
```
VITE_API_URL=https://your-api-url.com
```

### Docker Compose Production

The `docker-compose.yml` is configured for production. Update environment variables as needed.

### Manual Deployment

1. Build frontend:
```bash
cd web
npm run build
```

2. Run database migrations:
```bash
cd api
npx prisma migrate deploy
```

3. Start services (use PM2, systemd, or similar):
   - API server
   - Worker process
   - Web server (serve `web/dist`)

## Database Schema

### Core Entities

- **Program**: Programs with multi-language support
- **Term**: Terms within programs
- **Lesson**: Lessons within terms with publishing workflow
- **Topic**: Topics (many-to-many with programs)
- **ProgramAsset**: Program posters per language/variant
- **LessonAsset**: Lesson thumbnails per language/variant
- **User**: Users with roles (admin, editor, viewer)

### Constraints

- Unique `(program_id, term_number)`
- Unique `(term_id, lesson_number)`
- Unique `topic.name`
- If `lesson.status='scheduled'` → `publish_at IS NOT NULL`
- If `lesson.status='published'` → `published_at IS NOT NULL`
- Primary language must be in available languages
- Asset uniqueness constraints

### Indexes

- `lesson(status, publish_at)` - For worker queries
- `lesson(term_id, lesson_number)` - For ordering
- `program(status, language_primary, published_at)` - For catalog queries
- M2M join indexes for topic filters
- Asset lookup indexes

## Features

- ✅ Role-based access control (Admin, Editor, Viewer)
- ✅ JWT authentication
- ✅ Multi-language content support
- ✅ Scheduled publishing with worker
- ✅ Asset management (posters, thumbnails)
- ✅ Public catalog API with caching
- ✅ Database migrations
- ✅ Seed data for testing
- ✅ Docker Compose setup
- ✅ Health checks
- ✅ Structured logging

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check database credentials

### Migrations Not Running

- Ensure Prisma client is generated: `npx prisma generate`
- Check migration files exist in `api/prisma/migrations/`

### Worker Not Publishing Lessons

- Check worker logs: `docker compose logs worker`
- Verify worker is running: `docker compose ps`
- Check database connection in worker

### Frontend Can't Connect to API

- Verify API URL in `.env` or `vite.config.js`
- Check CORS settings in API
- Verify API is running: `curl http://localhost:3001/health`

## License

This project is a take-home assignment.
