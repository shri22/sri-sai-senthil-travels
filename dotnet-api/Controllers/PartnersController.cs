using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;
using S3T.Api.Services;
using System.Security.Claims;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Partner")]
    public class PartnersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PartnersController(AppDbContext context)
        {
            _context = context;
        }

        // --- Fleet Management ---

        [HttpGet("my-fleet")]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetMyFleet()
        {
            // Technically: We extract the Partner's Name from their logged-in Identity (JWT)
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            return await _context.Vehicles
                .Where(v => v.Company == partnerName && !v.IsDeleted)
                .ToListAsync();
        }

        [HttpPost("my-fleet")]
        public async Task<ActionResult<Vehicle>> AddToMyFleet(Vehicle vehicle)
        {
            // Technically: We force the 'Company' field to be the Partner's name
            // This prevents a Partner from adding a bus under 'Sri Sai Senthil Travels'
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            vehicle.Company = partnerName;
            vehicle.IsDeleted = false; // Ensure it's active
            
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            
            return Ok(vehicle);
        }

        // --- Booking Visibility ---

        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetMyBookings()
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? partnerId = null;
            if (int.TryParse(userIdString, out int pid)) partnerId = pid;
            
            // Fetch bookings that match EITHER:
            // 1. The vehicle belongs to this partner
            // 2. The booking was manually created by this partner (even if no vehicle assigned yet)
            var bookings = await _context.Bookings
                .Include(b => b.Payments)
                .Include(b => b.FuelLogs)
                .Include(b => b.Expenses)
                .GroupJoin(_context.Vehicles, 
                    b => b.VehicleId, 
                    v => v.Id, 
                    (b, vehicles) => new { b, vehicles })
                .SelectMany(x => x.vehicles.DefaultIfEmpty(), (x, v) => new { x.b, v })
                .Where(x => 
                    (x.v != null && x.v.Company == partnerName && !x.v.IsDeleted) || 
                    (partnerId.HasValue && x.b.PartnerId == partnerId.Value)
                )
                .Select(x => x.b)
                .ToListAsync();

            return Ok(bookings);
        }

        [HttpPut("my-fleet/{id}")]
        public async Task<IActionResult> UpdateMyVehicle(int id, Vehicle vehicle)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            var existingVehicle = await _context.Vehicles.FindAsync(id);
            
            if (existingVehicle == null || existingVehicle.Company != partnerName)
                return Unauthorized(new { error = "You do not own this vehicle." });

            if (id != vehicle.Id) return BadRequest();

            // Ensure company doesn't change
            vehicle.Company = partnerName;
            vehicle.IsDeleted = existingVehicle.IsDeleted; // Preserve delete status if accidentally passed
            
            _context.Entry(existingVehicle).State = EntityState.Detached;
            _context.Entry(vehicle).State = EntityState.Modified;
            
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("my-fleet/{id}")]
        public async Task<IActionResult> DeleteMyVehicle(int id)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            var vehicle = await _context.Vehicles.FindAsync(id);

            if (vehicle == null || vehicle.Company != partnerName)
                return Unauthorized(new { error = "You do not own this vehicle." });

            // Soft Delete
            vehicle.IsDeleted = true;
            vehicle.Status = "Inactive";
            
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("manual-booking")]
        public async Task<ActionResult<Booking>> CreateManualBooking(Booking booking)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            // Set the PartnerId so we know who created this booking
            if (int.TryParse(userIdString, out int pid)) 
            {
                booking.PartnerId = pid;
            }

            // Verify vehicle ownership ONLY if vehicle is assigned
            if (booking.VehicleId.HasValue)
            {
                var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
                if (vehicle == null || vehicle.Company != partnerName)
                    return Unauthorized(new { error = "You do not own this vehicle." });
            }

            booking.Status = "Confirmed"; // Manual entry is typically confirmed immediately
            booking.CreatedAt = DateTime.UtcNow;
            
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync(); // Save to get the ID

            // Block dates for the range only if vehicle is assigned
            if (booking.VehicleId.HasValue)
            {
                var start = booking.TravelDate.Date;
                var end = booking.EndDate?.Date ?? start;
                for (var d = start; d <= end; d = d.AddDays(1))
                {
                    _context.VehicleBlockedDates.Add(new VehicleBlockedDate {
                        VehicleId = booking.VehicleId.Value,
                        BlockedDate = d,
                        Reason = "Manual Reservation",
                        BookingId = booking.Id
                    });
                }
            }
            
            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        [HttpPut("bookings/{id}")]
        public async Task<IActionResult> UpdateBooking(long id, Booking updatedBooking)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            if (vehicle == null || vehicle.Company != partnerName)
                return Unauthorized();

            // Update allowed fields
            booking.CustomerName = updatedBooking.CustomerName;
            booking.CustomerPhone = updatedBooking.CustomerPhone;
            booking.CustomerEmail = updatedBooking.CustomerEmail;
            booking.CustomerAddress = updatedBooking.CustomerAddress;
            booking.PickupFrom = updatedBooking.PickupFrom;
            booking.DestinationTo = updatedBooking.DestinationTo;
            booking.Places = updatedBooking.Places;
            booking.NumDays = updatedBooking.NumDays;
            booking.NumPassengers = updatedBooking.NumPassengers;
            booking.BaseRentAmount = updatedBooking.BaseRentAmount;
            booking.MountainRent = updatedBooking.MountainRent;
            booking.DriverBatta = updatedBooking.DriverBatta;
            booking.PermitCost = updatedBooking.PermitCost;
            booking.TollCost = updatedBooking.TollCost;
            booking.OtherExpenses = updatedBooking.OtherExpenses;
            booking.DiscountAmount = updatedBooking.DiscountAmount;
            booking.TotalAmount = updatedBooking.TotalAmount;
            booking.Notes = updatedBooking.Notes;

            // If Dates or Vehicle changed, we need to re-block
            if (booking.TravelDate != updatedBooking.TravelDate || booking.EndDate != updatedBooking.EndDate || booking.VehicleId != updatedBooking.VehicleId)
            {
                // Remove old blocks
                var oldBlocks = _context.VehicleBlockedDates.Where(b => b.BookingId == id);
                _context.VehicleBlockedDates.RemoveRange(oldBlocks);

                booking.TravelDate = updatedBooking.TravelDate;
                booking.EndDate = updatedBooking.EndDate;
                booking.VehicleId = updatedBooking.VehicleId;

                // Add new blocks only if vehicle is assigned
                if (booking.VehicleId.HasValue)
                {
                    var start = booking.TravelDate.Date;
                    var end = booking.EndDate?.Date ?? start;
                    for (var d = start; d <= end; d = d.AddDays(1))
                    {
                        _context.VehicleBlockedDates.Add(new VehicleBlockedDate {
                            VehicleId = booking.VehicleId.Value,
                            BlockedDate = d,
                            Reason = "Manual Reservation Updated",
                            BookingId = booking.Id
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        [HttpPost("bookings/{id}/cancel")]
        public async Task<IActionResult> CancelBooking(long id)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            if (vehicle == null || vehicle.Company != partnerName)
                return Unauthorized();

            booking.Status = "Cancelled";
            booking.CancellationDate = DateTime.UtcNow;

            // Remove blocks
            var blocks = _context.VehicleBlockedDates.Where(b => b.BookingId == id);
            _context.VehicleBlockedDates.RemoveRange(blocks);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Booking cancelled successfully" });
        }

        [HttpPost("bookings/{id}/close")]
        public async Task<IActionResult> CloseTrip(long id, [FromBody] CloseTripRequest request)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            if (vehicle == null || vehicle.Company != partnerName)
                return Unauthorized();

            booking.Status = "Completed";
            booking.StartKms = request.StartKms;
            booking.EndKms = request.EndKms;
            booking.DistanceKm = request.EndKms - request.StartKms;
            booking.ActualStartTime = request.StartTime;
            booking.ActualEndTime = request.EndTime;

            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        public class CloseTripRequest
        {
            public int StartKms { get; set; }
            public int EndKms { get; set; }
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
        }

        [HttpPost("fuel-log")]
        public async Task<IActionResult> AddFuelLog(FuelLog log)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            // Verify booking belongs to partner's vehicle
            var booking = await _context.Bookings.FindAsync(log.BookingId);
            if (booking == null) return NotFound();
            
            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            if (vehicle == null || vehicle.Company != partnerName) 
                return Unauthorized(new { error = "Unauthorized access to this trip." });

            log.TotalCost = log.Liters * log.CostPerLiter;
            log.FilledAt = DateTime.UtcNow;
            
            _context.FuelLogs.Add(log);
            await _context.SaveChangesAsync();
            return Ok(log);
        }

        [HttpGet("reports/profit-loss")]
        public async Task<ActionResult<object>> GetProfitLossReport()
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            // Fetch bookings with their vehicles, fuel logs, and expenses
            var data = await _context.Bookings
                .Include(b => b.Expenses)
                .Include(b => b.FuelLogs)
                .Join(_context.Vehicles, b => b.VehicleId, v => v.Id, (b, v) => new { b, v })
                .Where(x => x.v.Company == partnerName) 
                .OrderByDescending(x => x.b.TravelDate)
                .ToListAsync();

            var individualReports = data.Select(x => {
                var fuelCost = x.b.FuelLogs.Sum(f => f.TotalCost);
                var otherExpenses = x.b.Expenses.Sum(e => e.Amount);
                
                // If no fuel logs, fallback to estimate (Optional fallback)
                if (fuelCost == 0 && x.b.DistanceKm > 0 && x.v.Mileage > 0)
                {
                    // Default diesel price fallback if not in logs
                     fuelCost = (decimal)((x.b.DistanceKm / x.v.Mileage) * 95.0); 
                }

                var totalTripCost = fuelCost + otherExpenses + x.b.DriverBatta + x.b.TollCost + x.b.PermitCost + x.b.OtherExpenses;
                var netProfit = x.b.TotalAmount - totalTripCost;

                return new {
                    BookingId = x.b.Id,
                    Date = x.b.TravelDate,
                    Vehicle = x.v.Name,
                    Number = x.v.Number,
                    Customer = x.b.CustomerName,
                    Status = x.b.Status,
                    DistanceKm = x.b.DistanceKm,
                    Revenue = x.b.TotalAmount,
                    FuelCost = Math.Round(fuelCost, 2),
                    OtherExpenses = otherExpenses + x.b.DriverBatta + x.b.TollCost + x.b.PermitCost + x.b.OtherExpenses,
                    NetProfit = Math.Round(netProfit, 2),
                    IsFuelEstimated = !x.b.FuelLogs.Any()
                };
            });

            return Ok(new {
                TotalRevenue = individualReports.Sum(r => r.Revenue),
                TotalExpenses = individualReports.Sum(r => r.OtherExpenses) + individualReports.Sum(r => r.FuelCost),
                TotalFuelCost = individualReports.Sum(r => r.FuelCost),
                TotalNetProfit = individualReports.Sum(r => r.NetProfit),
                Trips = individualReports
            });
        }
        [HttpPost("whatsapp/daily-report")]
        public async Task<IActionResult> SendDailyReport([FromServices] INotificationService notificationService)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            var phone = User.FindFirst(ClaimTypes.MobilePhone)?.Value ?? "9443856913"; // Default provided in instructions
            
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            var today = DateTime.UtcNow.Date;
            var bookingsToday = await _context.Bookings
                .Join(_context.Vehicles, b => b.VehicleId, v => v.Id, (b, v) => new { b, v })
                .Where(x => x.v.Company == partnerName && x.b.TravelDate.Date == today)
                .ToListAsync();

            if (bookingsToday.Count == 0) {
                await notificationService.SendWhatsAppMessageAsync(phone, $"[S3T] Namaste {partnerName}, No heritage journeys scheduled for today. Best luck for more bookings!");
                return Ok(new { message = "No trips today. Empty report sent." });
            }

            var report = $"[S3T DAILY REPORT] {today:dd MMM}\n";
            report += $"Namaste {partnerName}, you have {bookingsToday.Count} trips today:\n\n";
            
            foreach (var item in bookingsToday)
            {
                report += $"📍 {item.b.CustomerName} - {item.v.Name}\n";
                report += $"🛣️ {item.b.PickupFrom} to {item.b.DestinationTo}\n";
                report += $"💰 Total: ₹{item.b.TotalAmount}\n";
                report += "--------------------\n";
            }

            await notificationService.SendWhatsAppMessageAsync(phone, report);
            return Ok(new { message = "Daily Heritage Report sent via WhatsApp." });
        }
    }
}
