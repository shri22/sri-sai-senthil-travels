-- Migration Script for V2 Features
-- Run this on the MSSQL Server

USE S3T_Production;
GO

-- 1. Update Users Table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'CompanyName')
BEGIN
    ALTER TABLE Users ADD CompanyName NVARCHAR(MAX) DEFAULT '';
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Address')
BEGIN
    ALTER TABLE Users ADD Address NVARCHAR(MAX) DEFAULT '';
END
GO
UPDATE Users SET CompanyName = '' WHERE CompanyName IS NULL;
UPDATE Users SET Address = '' WHERE Address IS NULL;
GO

-- 2. Update Vehicles Table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vehicles') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE Vehicles ADD IsDeleted BIT DEFAULT 0;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Vehicles') AND name = 'Mileage')
BEGIN
    ALTER TABLE Vehicles ADD Mileage FLOAT DEFAULT 0;
END
GO
UPDATE Vehicles SET IsDeleted = 0 WHERE IsDeleted IS NULL;
UPDATE Vehicles SET Mileage = 0 WHERE Mileage IS NULL;
GO

-- 3. Update Bookings Table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'GroupBookingId') ALTER TABLE Bookings ADD GroupBookingId NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'CustomerAddress') ALTER TABLE Bookings ADD CustomerAddress NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'BaseRentAmount') ALTER TABLE Bookings ADD BaseRentAmount DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'MountainRent') ALTER TABLE Bookings ADD MountainRent DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'DriverBatta') ALTER TABLE Bookings ADD DriverBatta DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'PermitCost') ALTER TABLE Bookings ADD PermitCost DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'TollCost') ALTER TABLE Bookings ADD TollCost DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'OtherExpenses') ALTER TABLE Bookings ADD OtherExpenses DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'DiscountAmount') ALTER TABLE Bookings ADD DiscountAmount DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Inclusions') ALTER TABLE Bookings ADD Inclusions NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Notes') ALTER TABLE Bookings ADD Notes NVARCHAR(MAX) NULL;
GO
UPDATE Bookings SET BaseRentAmount = 0 WHERE BaseRentAmount IS NULL;
UPDATE Bookings SET MountainRent = 0 WHERE MountainRent IS NULL;
UPDATE Bookings SET DriverBatta = 0 WHERE DriverBatta IS NULL;
UPDATE Bookings SET PermitCost = 0 WHERE PermitCost IS NULL;
UPDATE Bookings SET TollCost = 0 WHERE TollCost IS NULL;
UPDATE Bookings SET OtherExpenses = 0 WHERE OtherExpenses IS NULL;
UPDATE Bookings SET DiscountAmount = 0 WHERE DiscountAmount IS NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Places') ALTER TABLE Bookings ADD Places NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'NumDays') ALTER TABLE Bookings ADD NumDays INT DEFAULT 1;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'NumPassengers') ALTER TABLE Bookings ADD NumPassengers INT DEFAULT 1;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'BalanceStatus') ALTER TABLE Bookings ADD BalanceStatus NVARCHAR(50) DEFAULT 'Pending';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'PaymentId') ALTER TABLE Bookings ADD PaymentId NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'RefundAmount') ALTER TABLE Bookings ADD RefundAmount DECIMAL(18,2) DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'CancellationDate') ALTER TABLE Bookings ADD CancellationDate DATETIME2 NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'ActualStartTime') ALTER TABLE Bookings ADD ActualStartTime DATETIME2 NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'ActualEndTime') ALTER TABLE Bookings ADD ActualEndTime DATETIME2 NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'StartKms') ALTER TABLE Bookings ADD StartKms INT NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'EndKms') ALTER TABLE Bookings ADD EndKms INT NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'DistanceKm') ALTER TABLE Bookings ADD DistanceKm INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Rating') ALTER TABLE Bookings ADD Rating INT NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Feedback') ALTER TABLE Bookings ADD Feedback NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'CurrentLat') ALTER TABLE Bookings ADD CurrentLat FLOAT NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'CurrentLng') ALTER TABLE Bookings ADD CurrentLng FLOAT NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'LastLocationUpdate') ALTER TABLE Bookings ADD LastLocationUpdate DATETIME2 NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'TrackingEnabled') ALTER TABLE Bookings ADD TrackingEnabled BIT DEFAULT 0;
GO
UPDATE Bookings SET BalanceStatus = 'Pending' WHERE BalanceStatus IS NULL;
UPDATE Bookings SET NumDays = 1 WHERE NumDays IS NULL;
UPDATE Bookings SET NumPassengers = 1 WHERE NumPassengers IS NULL;
UPDATE Bookings SET RefundAmount = 0 WHERE RefundAmount IS NULL;
GO


-- 4. Create PaymentLogs Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentLogs' AND xtype='U')
CREATE TABLE PaymentLogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BookingId BIGINT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    PaymentDate DATETIME2 NOT NULL,
    PaymentMode NVARCHAR(MAX) DEFAULT 'Cash',
    ReferenceNumber NVARCHAR(MAX) NULL,
    Notes NVARCHAR(MAX) NULL,
    CollectedBy NVARCHAR(MAX) DEFAULT '',
    CONSTRAINT FK_PaymentLogs_Bookings_BookingId FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
);
GO

-- 5. Create FuelLogs Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FuelLogs' AND xtype='U')
CREATE TABLE FuelLogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BookingId BIGINT NOT NULL,
    Place NVARCHAR(MAX) DEFAULT '',
    Liters DECIMAL(18,2) NOT NULL,
    CostPerLiter DECIMAL(18,2) NOT NULL,
    TotalCost DECIMAL(18,2) NOT NULL,
    OdometerReading INT NOT NULL,
    FilledAt DATETIME2 NOT NULL,
    ReceiptImage NVARCHAR(MAX) NULL,
    CONSTRAINT FK_FuelLogs_Bookings_BookingId FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
);
GO

-- 6. Create Expenses Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Expenses' AND xtype='U')
CREATE TABLE Expenses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BookingId BIGINT NOT NULL,
    Type NVARCHAR(MAX) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ReceiptImageUrl NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL,
    CONSTRAINT FK_Expenses_Bookings_BookingId FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
);
GO
