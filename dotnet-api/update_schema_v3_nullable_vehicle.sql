-- Migration: Make VehicleId nullable in Bookings table
-- Date: 2026-02-02
-- Purpose: Allow creating bookings without immediate vehicle assignment

USE S3T_Production;
GO

-- For SQL Server: Alter the VehicleId column to be nullable
ALTER TABLE Bookings
ALTER COLUMN VehicleId INT NULL;
GO

PRINT 'Migration completed: VehicleId is now nullable in Bookings table';
