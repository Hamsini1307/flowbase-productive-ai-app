CREATE TABLE IF NOT EXISTS "kanban_task_comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL,
  "parent_id" integer,
  "message" text NOT NULL,
  "author_id" integer,
  "author_name" text NOT NULL,
  "author_email" text,
  "author_image_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kanban_task_comments" ADD CONSTRAINT "kanban_task_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
