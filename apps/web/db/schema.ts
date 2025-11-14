import { pgTable, text, timestamp, uuid, integer, bigint, pgEnum } from 'drizzle-orm/pg-core';

export const visibilityEnum = pgEnum('visibility', ['public', 'private']);

export const uploads = pgTable(
	'uploads',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		objectKey: text('object_key').notNull(),
		mime: text('mime').notNull(),
		sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
		width: integer('width'),
		height: integer('height'),
		sha256: text('sha256'),
		visibility: visibilityEnum('visibility').notNull().default('private'),
		title: text('title'),
		ocrText: text('ocr_text'),
		caption: text('caption'),
		tags: text('tags').array().default([]),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
	}
);

export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
	}
);
