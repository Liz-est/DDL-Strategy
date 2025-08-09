-- CreateTable
CREATE TABLE "dify_apps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT,
    "description" TEXT,
    "tags" TEXT,
    "is_enabled" INTEGER DEFAULT 1,
    "api_base" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "enable_answer_form" BOOLEAN NOT NULL DEFAULT false,
    "answer_form_feedback_text" TEXT,
    "enable_update_input_after_starts" BOOLEAN NOT NULL DEFAULT false,
    "opening_statement_display_mode" TEXT
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
