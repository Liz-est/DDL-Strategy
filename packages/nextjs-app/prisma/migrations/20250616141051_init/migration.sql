-- CreateTable
CREATE TABLE "app" (
    "id" VARCHAR(36) NOT NULL,
    "api_base" VARCHAR(255) NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "mode" VARCHAR(20) NOT NULL DEFAULT 'chat',
    "answer_form_enabled" BOOLEAN NOT NULL DEFAULT false,
    "answer_form_feedback_text" VARCHAR(255) NOT NULL,
    "update_inputs_after_started" BOOLEAN NOT NULL DEFAULT false,
    "opening_statement_mode" VARCHAR(255) NOT NULL DEFAULT 'default',

    CONSTRAINT "app_pkey" PRIMARY KEY ("id")
);
