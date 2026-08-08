ALTER TABLE "projects" ADD COLUMN "install_command" varchar(512) DEFAULT 'npm install' NOT NULL;
ALTER TABLE "projects" ADD COLUMN "build_command" varchar(512) DEFAULT 'npm run build' NOT NULL;
ALTER TABLE "projects" ADD COLUMN "start_command" varchar(512) DEFAULT 'npm start' NOT NULL;