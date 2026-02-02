# S3T Heritage Travels - .NET Migration Guide

This folder contains the foundation for migrating the **Sri Sai Senthil Travels** backend to .NET 8 and SQL Server.

## 📁 Structure
- `/Models`: C# Domain entities (Vehicle, Booking).
- `/Controllers`: Web API Endpoints with business logic.
- `/Data`: EF Core Database Context.
- `schema.sql`: SQL Server script to create and seed the database.
- `/Hubs`: SignalR Tracking Hub for real-time GPS.
- `/Services/NotificationService.cs`: Push Notification logic.

## 📱 Mobile App Readiness
The API is pre-configured to support **Driver** and **Customer** mobile apps:
- **Real-time GPS**: Use the `/api/drivers/trips/{id}/location` endpoint to push GPS data from the driver app.
- **Trip Lifecycle**: Drivers can 'Start' and 'Complete' trips via the API, which automatically records timestamps and KM readings.
- **Push Notifications**: Integrated `DeviceToken` management in the `User` model, ready for Firebase/Apple notifications.

## 🚀 How to Run Locally

### 1. Database Setup
1. Open **SQL Server Management Studio (SSMS)** or Azure Data Studio.
2. Connect to your SQL Server instance.
3. Run the commands in `schema.sql` to create the tables and seed the initial fleet.

### 2. API Configuration
1. Open the project in **Visual Studio 2022** or **VS Code**.
2. Add an `appsettings.json` file with your connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=S3T_DB;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }
   ```
3. Run `dotnet restore` to install dependencies.
4. Run `dotnet run` to start the API.

### 3. Connecting the Frontend (Next.js)
In your existing Next.js project, update your environment variable to point to the new API:
`.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🔒 Key Features Migrated
- **Hill Station Logic**: The `.NET` API now handles terrain filtering directly in the SQL query for better performance.
- **Transactional Safety**: Bookings use SQL Transactions, preventing two people from booking the same bus simultaneously.
- **Relational Integrity**: SQL Server manages the relationship between Vehicles and their Blocked Dates.
