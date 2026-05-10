-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'h5',
    "dsl" TEXT NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'native',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_code_key" ON "Page"("code");
