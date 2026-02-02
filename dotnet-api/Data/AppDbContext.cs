using Microsoft.EntityFrameworkCore;
using S3T.Api.Models;

namespace S3T.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleBlockedDate> VehicleBlockedDates { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<SystemConfig> SystemConfigs { get; set; }
        public DbSet<PaymentLog> PaymentLogs { get; set; }
        public DbSet<FuelLog> FuelLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Vehicle>().Property(v => v.BasePrice).HasPrecision(18, 2);
            modelBuilder.Entity<Vehicle>().Property(v => v.PricePerKm).HasPrecision(18, 2);

            modelBuilder.Entity<Booking>().Property(b => b.TotalAmount).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.AdvancePaid).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.BaseRentAmount).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.MountainRent).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.DriverBatta).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.PermitCost).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.TollCost).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.OtherExpenses).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.DiscountAmount).HasPrecision(18, 2);
            modelBuilder.Entity<Booking>().Property(b => b.RefundAmount).HasPrecision(18, 2);
            
            modelBuilder.Entity<PaymentLog>().Property(p => p.Amount).HasPrecision(18, 2);
            
            modelBuilder.Entity<FuelLog>().Property(f => f.Liters).HasPrecision(18, 2);
            modelBuilder.Entity<FuelLog>().Property(f => f.CostPerLiter).HasPrecision(18, 2);
            modelBuilder.Entity<FuelLog>().Property(f => f.TotalCost).HasPrecision(18, 2);
            
            modelBuilder.Entity<Expense>().Property(e => e.Amount).HasPrecision(18, 2);
        }
    }
}
