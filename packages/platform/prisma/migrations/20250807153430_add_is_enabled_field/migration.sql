-- CreateTable
CREATE TABLE "dify_apps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT,
    "description" TEXT,
    "tags" TEXT,
    "is_enabled" INTEGER NOT NULL DEFAULT 1,
    "api_base" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "enable_answer_form" BOOLEAN NOT NULL DEFAULT false,
    "answer_form_feedback_text" TEXT,
    "enable_update_input_after_starts" BOOLEAN NOT NULL DEFAULT false,
    "opening_statement_display_mode" TEXT
);
