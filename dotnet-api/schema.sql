-- =============================================
-- SRI SAI SENTHIL TRAVELS - DATABASE SCHEMA
-- Target Database: SQL Server
-- =============================================

-- 1. Create Users Table
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Role NVARCHAR(20) NOT NULL,                -- 'Admin', 'Partner', 'Customer', 'Driver'
    Phone NVARCHAR(20),
    DeviceToken NVARCHAR(MAX),                 -- For Mobile Push Notifications
    Status NVARCHAR(20) DEFAULT 'Active',      -- 'Active', 'Pending', 'Rejected'
    JoinedAt DATETIME DEFAULT GETDATE()
);

-- Seed Initial Users (Based on JSON data)
-- Passwords: admin123 (Admin), partner123 (Partner), driver123 (Driver)
INSERT INTO Users (Email, Name, PasswordHash, Role, Status) VALUES 
('admin@s3t.com', 'System Admin', '$2b$10$C12R78.O1J5N9.e8u0N0.e8u0N0.e8u0N0.e8u0N0.e8u0N0.', 'Admin', 'Active'),
('partner@royal.com', 'Royal Travels', '$2b$10$P12R78.O1J5N9.e8u0N0.e8u0N0.e8u0N0.e8u0N0.e8u0N0.', 'Partner', 'Active'),
('driver1@s3t.com', 'Kathiravan', '$2b$10$D12R78.O1J5N9.e8u0N0.e8u0N0.e8u0N0.e8u0N0.e8u0N0.', 'Driver', 'Active');

-- ... (Vehicles and BlockedDates tables remain same)

-- 3. Create Bookings Table
CREATE TABLE Bookings (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    VehicleId INT FOREIGN KEY REFERENCES Vehicles(Id),
    DriverId INT FOREIGN KEY REFERENCES Users(Id), -- Assigned Driver
    CustomerName NVARCHAR(100) NOT NULL,
    CustomerEmail NVARCHAR(100) NOT NULL,
    CustomerPhone NVARCHAR(20),
    PickupFrom NVARCHAR(100) NOT NULL,
    DestinationTo NVARCHAR(100) NOT NULL,
    TravelDate DATE NOT NULL,
    EndDate DATE NULL,
    DistanceKm INT NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    AdvancePaid DECIMAL(18,2) NOT NULL,
    BalanceAmount AS (TotalAmount - AdvancePaid),
    PaymentMethod NVARCHAR(20),                -- 'Online', 'Cash'
    
    -- Status: Confirmed, Started, InProgress, Completed, Cancelled
    [Status] NVARCHAR(20) DEFAULT 'Confirmed',   
    
    -- Live Tracking Data (Mobile App Support)
    CurrentLat FLOAT,
    CurrentLng FLOAT,
    LastLocationUpdate DATETIME,
    StartKms INT,
    EndKms INT,
    ActualStartTime DATETIME,
    ActualEndTime DATETIME,
    
    CreatedAt DATETIME DEFAULT GETDATE(),
    PartnerName NVARCHAR(100)
);

-- 4. Create AppSettings Table (Config Management)
CREATE TABLE SystemConfig (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ConfigKey NVARCHAR(50) UNIQUE NOT NULL,
    ConfigValue NVARCHAR(MAX) NOT NULL,
    Description NVARCHAR(200)
);

-- Seed Initial Config
INSERT INTO SystemConfig (ConfigKey, ConfigValue, Description) VALUES 
('CommissionPercentage', '20', 'Default platform commission'),
('AdvancePercentage', '30', 'Standard advance required'),
('DriverBataPerDay', '500', 'Driver allowance per day');

-- 5. Seed Initial Fleet (Migration from current data.json)
INSERT INTO Vehicles (Name, Number, Type, Capacity, BasePrice, PricePerKm, Terrain, Company, ImageName) VALUES
('Luxury Volvo B11R', 'TN 01 AB 1234', 'Sleeper AC', 36, 18000, 45, 'all', 'Sri Sai Senthil Travels', 'luxury_volvo_coach'),
('Heritage Traveler V12', 'TN 02 CD 5678', 'Luxury Van', 12, 12000, 25, 'all', 'Royal Travels', 'premium_heritage_van_v12'),
('Semi-Luxury Mini 32', 'TN 03 EF 9012', 'Mini Bus', 32, 15000, 35, 'plain', 'Heritage Voyagers', 'modern_minibus_heritage_edition');
