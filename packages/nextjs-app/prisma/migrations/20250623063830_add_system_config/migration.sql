-- CreateTable
CREATE TABLE "system_config" (
    "id" VARCHAR(36) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);
