using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace S3T.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty; // Contact Person Name
        
        public string CompanyName { get; set; } = string.Empty; // Agency/Company Name
        public string Address { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public string Role { get; set; } = "Customer"; // Admin, Partner, Customer, Driver
        public string? Phone { get; set; }
        public string? DeviceToken { get; set; } // For Push Notifications
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Active"; // Active, Pending
    }

    public class Vehicle
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Number { get; set; } = string.Empty;
        
        public string Type { get; set; } = string.Empty; // Car, Van, Mini Bus, Bus
        public bool HasAc { get; set; } = true;
        public int Capacity { get; set; }
        public decimal BasePrice { get; set; } // Base Rent Per Day
        public decimal PricePerKm { get; set; }
        public double Mileage { get; set; } = 0; // Estimated mileage for reports
        public string Terrain { get; set; } = "all";
        public string Company { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active, Inactive
        public bool IsDeleted { get; set; } = false; // Soft Delete
        public string? ImageName { get; set; }
        public double AverageRating { get; set; } = 5.0;
        
        public List<VehicleBlockedDate> BlockedDates { get; set; } = new();
    }

    public class VehicleBlockedDate
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public DateTime BlockedDate { get; set; }
        public string? Reason { get; set; }
        public long? BookingId { get; set; }
    }

    public class Booking
    {
        public long Id { get; set; }
        public string? GroupBookingId { get; set; } // To link multiple buses in one trip
        
        public int VehicleId { get; set; }
        public int? DriverId { get; set; }
        
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public string? CustomerAddress { get; set; }
        
        public string PickupFrom { get; set; } = string.Empty;
        public string DestinationTo { get; set; } = string.Empty;
        public string? Places { get; set; } // List of places to visit
        
        public DateTime TravelDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int NumDays { get; set; } = 1;
        public int NumPassengers { get; set; } = 1;
        
        // --- Pricing ----
        public decimal BaseRentAmount { get; set; } // Total Base Rent (BasePrice * Days)
        public decimal MountainRent { get; set; } = 0; // Extra for Hills
        public decimal DriverBatta { get; set; } = 0; // Driver Allowance
        public decimal PermitCost { get; set; } = 0;
        public decimal TollCost { get; set; } = 0;
        public decimal OtherExpenses { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        
        public decimal TotalAmount { get; set; } // Final Bill Amount
        public decimal AdvancePaid { get; set; } // Sum of all advances
        public decimal BalanceAmount => TotalAmount - AdvancePaid;

        public string PaymentMethod { get; set; } = "Online"; // Online, Cash
        public string BalanceStatus { get; set; } = "Pending"; // Paid, Pending
        public string? Inclusions { get; set; } // Included items description
        public string? Notes { get; set; } // Internal Notes
        
        // Status: PendingPayment, Confirmed, Started, InProgress, Completed, Cancelled
        public string Status { get; set; } = "PendingPayment"; 

        // Payment & Cancellation
        public string? PaymentId { get; set; } // Razorpay/Stripe ID
        public DateTime? CancellationDate { get; set; }
        public decimal RefundAmount { get; set; }
        
        // Trip Live Data
        public double? CurrentLat { get; set; }
        public double? CurrentLng { get; set; }
        public DateTime? LastLocationUpdate { get; set; }
        public bool TrackingEnabled { get; set; } = false; // Enabled only near/during trip
        
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }
        public int? StartKms { get; set; }
        public int? EndKms { get; set; }
        public int TotalKm => (EndKms ?? 0) - (StartKms ?? 0);
        public int DistanceKm { get; set; } // Estimated Distance
        
        // Review
        public int? Rating { get; set; } // 1-5 stars
        public string? Feedback { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relationships
        public List<PaymentLog> Payments { get; set; } = new();
        public List<FuelLog> FuelLogs { get; set; } = new();
        public List<Expense> Expenses { get; set; } = new();
    }

    public class PaymentLog
    {
        public int Id { get; set; }
        public long BookingId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public string PaymentMode { get; set; } = "Cash"; // Cash, UPI, Bank Transfer
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
        public string CollectedBy { get; set; } = string.Empty; // User who collected it
    }

    public class FuelLog
    {
        public int Id { get; set; }
        public long BookingId { get; set; }
        public string Place { get; set; } = string.Empty;
        public decimal Liters { get; set; }
        public decimal CostPerLiter { get; set; }
        public decimal TotalCost { get; set; }
        public int OdometerReading { get; set; }
        public DateTime FilledAt { get; set; } = DateTime.UtcNow;
        public string? ReceiptImage { get; set; }
    }

    public class Expense
    {
        public int Id { get; set; }
        public long BookingId { get; set; }
        [Required] public string Type { get; set; } = string.Empty; // Diesel, Toll, Permit, Driver Bata, Other
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public string? ReceiptImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Review
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SystemConfig
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
