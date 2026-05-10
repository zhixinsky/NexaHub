-- CreateTable
CREATE TABLE "AttachmentCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pid" TEXT NOT NULL DEFAULT '0',
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnable" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "ext" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attachment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AttachmentCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AttachmentCategory_pid_idx" ON "AttachmentCategory"("pid");

-- CreateIndex
CREATE INDEX "AttachmentCategory_sort_idx" ON "AttachmentCategory"("sort");

-- CreateIndex
CREATE INDEX "Attachment_type_createdAt_idx" ON "Attachment"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_categoryId_idx" ON "Attachment"("categoryId");

-- CreateIndex
CREATE INDEX "Attachment_original_idx" ON "Attachment"("original");
