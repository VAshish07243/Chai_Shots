-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('draft', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('video', 'article');

-- CreateEnum
CREATE TYPE "AssetVariant" AS ENUM ('portrait', 'landscape', 'square', 'banner');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('poster', 'thumbnail');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor', 'viewer');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "languagePrimary" TEXT NOT NULL,
    "languagesAvailable" TEXT[],
    "status" "ProgramStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTopic" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "ProgramTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "durationMs" INTEGER,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "contentLanguagePrimary" TEXT NOT NULL,
    "contentLanguagesAvailable" TEXT[],
    "contentUrlsByLanguage" JSONB NOT NULL,
    "subtitleLanguages" TEXT[],
    "subtitleUrlsByLanguage" JSONB,
    "status" "LessonStatus" NOT NULL DEFAULT 'draft',
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramAsset" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variant" "AssetVariant" NOT NULL,
    "assetType" "AssetType" NOT NULL DEFAULT 'poster',
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonAsset" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variant" "AssetVariant" NOT NULL,
    "assetType" "AssetType" NOT NULL DEFAULT 'thumbnail',
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Program_status_languagePrimary_publishedAt_idx" ON "Program"("status", "languagePrimary", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE INDEX "ProgramTopic_programId_idx" ON "ProgramTopic"("programId");

-- CreateIndex
CREATE INDEX "ProgramTopic_topicId_idx" ON "ProgramTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTopic_programId_topicId_key" ON "ProgramTopic"("programId", "topicId");

-- CreateIndex
CREATE INDEX "Term_programId_idx" ON "Term"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "Term_programId_termNumber_key" ON "Term"("programId", "termNumber");

-- CreateIndex
CREATE INDEX "Lesson_termId_lessonNumber_idx" ON "Lesson"("termId", "lessonNumber");

-- CreateIndex
CREATE INDEX "Lesson_status_publishAt_idx" ON "Lesson"("status", "publishAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_termId_lessonNumber_key" ON "Lesson"("termId", "lessonNumber");

-- CreateIndex
CREATE INDEX "ProgramAsset_programId_language_idx" ON "ProgramAsset"("programId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramAsset_programId_language_variant_assetType_key" ON "ProgramAsset"("programId", "language", "variant", "assetType");

-- CreateIndex
CREATE INDEX "LessonAsset_lessonId_language_idx" ON "LessonAsset"("lessonId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "LessonAsset_lessonId_language_variant_assetType_key" ON "LessonAsset"("lessonId", "language", "variant", "assetType");

-- AddForeignKey
ALTER TABLE "ProgramTopic" ADD CONSTRAINT "ProgramTopic_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramTopic" ADD CONSTRAINT "ProgramTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAsset" ADD CONSTRAINT "ProgramAsset_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAsset" ADD CONSTRAINT "LessonAsset_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
