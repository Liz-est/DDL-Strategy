import {
	pgTable,
	varchar,
	timestamp,
	boolean,
	text,
	uuid,
} from "drizzle-orm/pg-core";

// 系统配置
export const systemConfig = pgTable("system_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar("key", { length: 255 }).notNull(),
	value: varchar("value", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// 应用
export const app = pgTable("app", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	apiBase: varchar("api_base", { length: 255 }).notNull(),
	apiKey: varchar("api_key", { length: 255 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 255 }).notNull(),
	tags: text("tags").default(""),
	mode: varchar("mode", { length: 20 }).default("chat"),
	answerFormEnabled: boolean("answer_form_enabled").default(false),
	answerFormFeedbackText: varchar("answer_form_feedback_text", {
		length: 255,
	}).notNull(),
	updateInputsAfterStarted: boolean("update_inputs_after_started").default(
		false,
	),
	openingStatementMode: varchar("opening_statement_mode", {
		length: 255,
	}).default("default"),
	isEnabled: boolean("is_enabled").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});
