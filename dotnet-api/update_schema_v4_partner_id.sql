-- Migration: Add PartnerId to Bookings table
-- Date: 2026-02-02
-- Purpose: Track booking ownership for partners even when no vehicle is assigned

USE S3T_Production;
GO

-- Check if column exists before adding (for idempotency)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bookings' AND COLUMN_NAME = 'PartnerId')
BEGIN
    ALTER TABLE Bookings
    ADD PartnerId INT NULL;
    
    PRINT 'Added PartnerId column to Bookings table';
END
ELSE
BEGIN
    PRINT 'PartnerId column already exists';
END
GO
