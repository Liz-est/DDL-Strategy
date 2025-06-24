CREATE TABLE "app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_base" varchar(255) NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"tags" text DEFAULT '',
	"mode" varchar(20) DEFAULT 'chat',
	"answer_form_enabled" boolean DEFAULT false,
	"answer_form_feedback_text" varchar(255) NOT NULL,
	"update_inputs_after_started" boolean DEFAULT false,
	"opening_statement_mode" varchar(255) DEFAULT 'default',
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
