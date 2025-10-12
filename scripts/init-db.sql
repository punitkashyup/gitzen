-- ================================================
-- Gitzen Database Initialization Script
-- ================================================
-- This script runs automatically when PostgreSQL
-- container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database (if using different name)
-- Already created by POSTGRES_DB env var

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE gitzen TO gitzen;

-- Create initial schema
CREATE SCHEMA IF NOT EXISTS public;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Gitzen database initialized successfully';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm enabled';
    RAISE NOTICE 'Ready for migrations';
END $$;
