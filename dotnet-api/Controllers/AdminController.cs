using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // --- Partner Management ---

        [HttpGet("partners")]
        public async Task<ActionResult<IEnumerable<User>>> GetPartners()
        {
            return await _context.Users
                .Where(u => u.Role == "Partner")
                .OrderByDescending(u => u.JoinedAt)
                .ToListAsync();
        }

        [HttpPatch("partners/{id}/status")]
        public async Task<IActionResult> UpdatePartnerStatus(int id, [FromQuery] string status)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.Role != "Partner") return NotFound();

            user.Status = status;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Partner {user.Name} is now {status}" });
        }

        // --- System Configuration ---

        [HttpGet("config")]
        public async Task<ActionResult<IEnumerable<SystemConfig>>> GetConfig()
        {
            return await _context.SystemConfigs.ToListAsync();
        }

        [HttpPost("config")]
        public async Task<IActionResult> UpdateConfig([FromBody] List<SystemConfig> configs)
        {
            foreach (var config in configs)
            {
                var existing = await _context.SystemConfigs.FindAsync(config.Key);
                if (existing != null)
                {
                    existing.Value = config.Value;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else 
                {
                    _context.SystemConfigs.Add(config);
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Configuration updated successfully" });
        }

        // --- Fleet Management (Global) ---

        [HttpGet("fleet")]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetGlobalFleet()
        {
            return await _context.Vehicles.ToListAsync();
        }

        [HttpPost("fleet")]
        public async Task<ActionResult<Vehicle>> AddInternalVehicle(Vehicle vehicle)
        {
            vehicle.Company = "Sri Sai Senthil Travels"; 
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
        }

        [HttpPost("manual-booking")]
        public async Task<ActionResult<Booking>> CreateManualBooking(Booking booking)
        {
            // Admin can book for ANY vehicle (global management)
            booking.Status = "Confirmed";
            booking.CreatedAt = DateTime.UtcNow;
            
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            var start = booking.TravelDate.Date;
            var end = booking.EndDate?.Date ?? start;
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                _context.VehicleBlockedDates.Add(new VehicleBlockedDate {
                    VehicleId = booking.VehicleId,
                    BlockedDate = d,
                    Reason = "Admin Manual Entry",
                    BookingId = booking.Id
                });
            }
            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        [HttpGet("fleet/{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null) return NotFound();
            return vehicle;
        }

        [HttpPut("fleet/{id}")]
        public async Task<IActionResult> UpdateVehicle(int id, Vehicle vehicle)
        {
            if (id != vehicle.Id) return BadRequest();
            _context.Entry(vehicle).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("fleet/{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null) return NotFound();
            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // --- Booking Management ---

        [HttpGet("bookings")]
        public async Task<ActionResult<IEnumerable<object>>> GetGlobalBookings()
        {
            var bookings = await _context.Bookings
                .Join(_context.Vehicles, b => b.VehicleId, v => v.Id, (b, v) => new { b, v })
                .Select(x => new {
                    x.b.Id,
                    x.b.CustomerName,
                    x.b.TravelDate,
                    x.b.EndDate,
                    x.b.Status,
                    x.b.TotalAmount,
                    VehicleName = x.v.Name,
                    PartnerCompany = x.v.Company
                })
                .ToListAsync();

            return Ok(bookings);
        }

        [HttpPut("bookings/{id}")]
        public async Task<IActionResult> UpdateBooking(long id, Booking booking)
        {
            if (id != booking.Id) return BadRequest();
            _context.Entry(booking).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("bookings/{id}")]
        public async Task<IActionResult> DeleteBooking(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();
            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
