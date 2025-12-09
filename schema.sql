-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- States Table
CREATE TABLE IF NOT EXISTS states (
    state_uuid UUID PRIMARY KEY,
    state_name TEXT NOT NULL
);
0
-- Districts Table
CREATE TABLE IF NOT EXISTS districts (
    district_uuid UUID PRIMARY KEY,
    district_name TEXT NOT NULL,
    state_uuid UUID REFERENCES states(state_uuid)
);

-- Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
    block_uuid UUID PRIMARY KEY,
    block_name TEXT NOT NULL,
    district_uuid UUID REFERENCES districts(district_uuid),
    state_uuid UUID REFERENCES states(state_uuid),
    geometry JSONB
);

-- Assessments Summary Table
CREATE TABLE IF NOT EXISTS assessments_summary (
    assessment_id SERIAL PRIMARY KEY,
    block_uuid UUID REFERENCES blocks(block_uuid),
    year TEXT NOT NULL,
    rainfall DOUBLE PRECISION,
    total_recharge DOUBLE PRECISION,
    total_discharge DOUBLE PRECISION,
    total_extractable DOUBLE PRECISION,
    total_extraction DOUBLE PRECISION,
    category TEXT,
    stage DOUBLE PRECISION,
    availability DOUBLE PRECISION,
    raw JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_uuid, year)
);

-- Breakdown Tables
CREATE TABLE IF NOT EXISTS assessments_recharge_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments_summary(assessment_id) ON DELETE CASCADE,
    source TEXT,
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS assessments_discharge_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments_summary(assessment_id) ON DELETE CASCADE,
    source TEXT,
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS assessments_extraction_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments_summary(assessment_id) ON DELETE CASCADE,
    source TEXT,
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);
