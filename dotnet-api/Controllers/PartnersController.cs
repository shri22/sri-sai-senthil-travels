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
                .Where(v => v.Company == partnerName)
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
            
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            
            return Ok(vehicle);
        }

        // --- Booking Visibility ---

        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetMyBookings()
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            
            // Technically: This is a 'Join' query. We look for bookings where 
            // the associated Vehicle belongs to this Partner.
            var bookings = await _context.Bookings
                .Join(_context.Vehicles, 
                    b => b.VehicleId, 
                    v => v.Id, 
                    (b, v) => new { b, v })
                .Where(x => x.v.Company == partnerName)
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

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpPost("manual-booking")]
        public async Task<ActionResult<Booking>> CreateManualBooking(Booking booking)
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            // Verify vehicle ownership
            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            if (vehicle == null || vehicle.Company != partnerName)
                return Unauthorized(new { error = "You do not own this vehicle." });

            booking.Status = "Confirmed"; // Manual entry is typically confirmed immediately
            booking.CreatedAt = DateTime.UtcNow;
            
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync(); // Save to get the ID

            // Block dates for the range
            var start = booking.TravelDate.Date;
            var end = booking.EndDate?.Date ?? start;
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                _context.VehicleBlockedDates.Add(new VehicleBlockedDate {
                    VehicleId = booking.VehicleId,
                    BlockedDate = d,
                    Reason = "Manual Reservation",
                    BookingId = booking.Id
                });
            }
            
            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        [HttpGet("reports/profit-loss")]
        public async Task<ActionResult<object>> GetProfitLossReport()
        {
            var partnerName = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(partnerName)) return Unauthorized();

            var dieselPriceStr = (await _context.SystemConfigs.FindAsync("DieselPrice"))?.Value ?? "95";
            decimal dieselPrice = decimal.Parse(dieselPriceStr);

            // Fetch bookings with their vehicles to get mileage
            var data = await _context.Bookings
                .Include(b => b.Expenses)
                .Join(_context.Vehicles, b => b.VehicleId, v => v.Id, (b, v) => new { b, v })
                .Where(x => x.v.Company == partnerName) // Including all to show status
                .ToListAsync();

            var individualReports = data.Select(x => {
                var distance = x.b.DistanceKm;
                var mileage = (decimal)x.v.Mileage;
                var calculatedFuelCost = mileage > 0 ? (distance / mileage) * dieselPrice : 0;
                var actualExpenses = x.b.Expenses.Sum(e => e.Amount);
                var totalCost = actualExpenses + calculatedFuelCost;

                return new {
                    BookingId = x.b.Id,
                    Date = x.b.TravelDate,
                    Customer = x.b.CustomerName,
                    Status = x.b.Status,
                    Days = x.b.NumDays,
                    Places = x.b.Places,
                    DistanceKm = distance,
                    Revenue = x.b.TotalAmount,
                    CalculatedFuelCost = Math.Round(calculatedFuelCost, 2),
                    ActualExpenses = actualExpenses,
                    NetProfit = x.b.TotalAmount - totalCost
                };
            });

            return Ok(new {
                TotalRevenue = individualReports.Sum(r => r.Revenue),
                TotalExpenses = individualReports.Sum(r => r.ActualExpenses),
                TotalCalculatedFuelCost = individualReports.Sum(r => r.CalculatedFuelCost),
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
