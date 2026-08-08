ALTER TABLE "projects" ADD COLUMN "subdomain" varchar(63) DEFAULT gen_random_uuid()::text NOT NULL;
ALTER TABLE "projects" ADD CONSTRAINT "projects_subdomain_unique" UNIQUE("subdomain");