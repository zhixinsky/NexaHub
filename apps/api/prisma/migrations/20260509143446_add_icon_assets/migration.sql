-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL DEFAULT '',
    "filename" TEXT NOT NULL DEFAULT '',
    "original" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "ext" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "iconClass" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attachment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AttachmentCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("categoryId", "createdAt", "ext", "filename", "id", "original", "size", "title", "type", "updatedAt", "url") SELECT "categoryId", "createdAt", "ext", "filename", "id", "original", "size", "title", "type", "updatedAt", "url" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE INDEX "Attachment_type_createdAt_idx" ON "Attachment"("type", "createdAt");
CREATE INDEX "Attachment_categoryId_idx" ON "Attachment"("categoryId");
CREATE INDEX "Attachment_original_idx" ON "Attachment"("original");
CREATE INDEX "Attachment_iconClass_idx" ON "Attachment"("iconClass");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
