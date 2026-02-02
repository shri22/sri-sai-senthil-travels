using System.ComponentModel.DataAnnotations;

namespace S3T.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public string Role { get; set; } = "Customer"; // Admin, Partner, Customer, Driver
        public string? Phone { get; set; }
        public string? DeviceToken { get; set; } // For Push Notifications
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Active"; // Active, Pending (for Partners)
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
        public decimal BasePrice { get; set; }
        public decimal PricePerKm { get; set; }
        public double Mileage { get; set; } = 0; // Added for profit/loss calculation
        public string Terrain { get; set; } = "all";
        public string Company { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
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
        public int VehicleId { get; set; }
        public int? DriverId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public string PickupFrom { get; set; } = string.Empty;
        public string DestinationTo { get; set; } = string.Empty;
        public string? Places { get; set; } // List of places to visit
        public DateTime TravelDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int NumDays { get; set; } = 1;
        public int NumPassengers { get; set; } = 1;
        public int DistanceKm { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AdvancePaid { get; set; }
        public string PaymentMethod { get; set; } = "Online"; // Online, Cash
        public string BalanceStatus { get; set; } = "Pending"; // Paid, Cash on Tour Date, Pending
        public string? Inclusions { get; set; } // JSON or semi-colon separated (Driver, Toll, etc.)
        
        // Status: PendingPayment, Confirmed, Started, InProgress, Completed, Cancelled
        public string Status { get; set; } = "PendingPayment"; 

        // Payment & Cancellation
        public string? PaymentId { get; set; } // Razorpay/Stripe ID
        public DateTime? CancellationDate { get; set; }
        public decimal RefundAmount { get; set; }
        
        // Review
        public int? Rating { get; set; } // 1-5 stars
        public string? Feedback { get; set; }
        
        // Trip Live Data
        public double? CurrentLat { get; set; }
        public double? CurrentLng { get; set; }
        public DateTime? LastLocationUpdate { get; set; }
        public int? StartKms { get; set; }
        public int? EndKms { get; set; }
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }
        public bool TrackingEnabled { get; set; } = false; // Enabled only near/during trip
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Expense> Expenses { get; set; } = new();
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
