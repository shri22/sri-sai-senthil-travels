# 🧪 S3T Heritage API - Testing Cheat Sheet

Use this guide to verify your **.NET 8 + SQL Server** backend. You can use **Postman**, **Insomnia**, or the built-in **Swagger UI** (`http://localhost:5000/swagger`).

---

## 🔐 1. Authentication (AccountController)

### Login (Driver / Admin / Partner)
**POST** `http://localhost:5000/api/account/login`
```json
{
  "email": "driver1@s3t.com",
  "password": "driver123"
}
```
> **Note:** Copy the `token` from the response. In Postman, add it to the **Authorization** tab as a **Bearer Token** for all other requests.

### Register (New Customer)
**POST** `http://localhost:5000/api/account/register`
```json
{
  "name": "Arun Kumar",
  "email": "arun@example.com",
  "password": "customer123",
  "role": "Customer"
}
```

---

## 🚌 2. Fleet & Booking (BookingsController)

### Search Vehicles (With Filters)
**GET** `http://localhost:5000/api/bookings?terrain=hills&travelDate=2026-03-15`
*(Verifies if vehicles are filtered for hill-compatibility and date availability)*

### Create a Reservation
**POST** `http://localhost:5000/api/bookings`
```json
{
  "vehicleId": 1,
  "customerName": "Arun Kumar",
  "customerEmail": "arun@example.com",
  "pickupFrom": "Chennai",
  "destinationTo": "Madurai",
  "travelDate": "2026-03-15",
  "distanceKm": 450,
  "totalAmount": 25000,
  "advancePaid": 7500
}
```

### Download Branded Invoice (PDF)
**GET** `http://localhost:5000/api/bookings/1/invoice`
*(Open this in your browser to see the professional PDF receipt)*

---

## 👑 3. Admin Oversight (AdminController)
*Requires Bearer Token with Admin Role*

### Get Pending Partners
**GET** `http://localhost:5000/api/admin/partners`

### Approve a Partner
**PATCH** `http://localhost:5000/api/admin/partners/2/status`
**Body:** `"Active"` (Plain text or JSON string)

---

## 📱 4. Driver Mobile App (DriversController)
*Requires Bearer Token with Driver Role*

### Start Trip (Captures Start KM)
**PATCH** `http://localhost:5000/api/drivers/trips/1/status`
```json
{
  "status": "Started",
  "kms": 12450
}
```

### Push Live GPS (Real-time Tracking)
**POST** `http://localhost:5000/api/drivers/trips/1/location`
```json
{
  "lat": 13.0827,
  "lng": 80.2707,
  "speed": 45.5
}
```
> **Verify:** Open your website tracking page. You should see the bus icon move instantly via **SignalR**.

### Complete Trip
**PATCH** `http://localhost:5000/api/drivers/trips/1/status`
```json
{
  "status": "Completed",
  "kms": 12900
}
```

### Log Driver Expense (Fuel/Tolls)
**POST** `http://localhost:5000/api/drivers/trips/1/expenses`
```json
{
  "type": "Fuel",
  "amount": 4500,
  "description": "Full tank diesel at BP junction"
}
```

---

## 💸 5. Payments & Cancellations (Payments / Bookings)

### Initiate Payment (Razorpay Mock)
**GET** `http://localhost:5000/api/payments/initiate/1`
> Use this to get the `orderId` and `amount` for the frontend checkout.

### Submit Trip Review (Post-Trip)
**POST** `http://localhost:5000/api/bookings/1/review`
```json
{
  "rating": 5,
  "comment": "Driver Pathiravan was very professional. The bus was clean and on time!"
}
```

### Cancel Booking (With Refund Logic)
**POST** `http://localhost:5000/api/bookings/1/cancel`
> **Auto-Rule:** If travel is > 24hrs away, 100% refund. If < 24hrs, 50% refund is deducted from advance.

---

## 🛰️ 6. Real-time Connection (SignalR)
**Hub URL:** `ws://localhost:5000/hubs/tracking`
**Method to Join:** `JoinTripGroup(bookingId)`
**Event to Listen:** `ReceiveLocationUpdate`

---

## 🛠️ Troubleshooting
1. **401 Unauthorized**: Ensure you have pasted the JWT token correctly in the Bearer field.
2. **Database Error**: Ensure you have run the `schema.sql` script in your SQL Server instance.
3. **CORS Error**: Ensure your frontend is running on `http://localhost:3000` as configured in `Program.cs`.
