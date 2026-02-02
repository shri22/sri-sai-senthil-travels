using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;
using Microsoft.AspNetCore.SignalR;
using S3T.Api.Hubs;
using System.Security.Claims;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Driver,Admin")]
    public class DriversController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<TrackingHub> _hubContext;

        public DriversController(AppDbContext context, IHubContext<TrackingHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("my-trips")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetMyTrips()
        {
            var driverId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            return await _context.Bookings
                .Where(b => b.DriverId == driverId)
                .OrderByDescending(b => b.TravelDate)
                .ToListAsync();
        }

        [HttpPatch("trips/{id}/status")]
        public async Task<IActionResult> UpdateTripStatus(long id, [FromBody] TripStatusUpdateRequest request)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            booking.Status = request.Status;
            
            if (request.Status == "Started")
            {
                booking.ActualStartTime = DateTime.UtcNow;
                booking.StartKms = request.Kms;
            }
            else if (request.Status == "Completed")
            {
                booking.ActualEndTime = DateTime.UtcNow;
                booking.EndKms = request.Kms;
            }

            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        [HttpPost("trips/{id}/location")]
        public async Task<IActionResult> UpdateLocation(long id, [FromBody] LocationUpdate update)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            booking.CurrentLat = update.Lat;
            booking.CurrentLng = update.Lng;
            booking.LastLocationUpdate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify real-time clients (Customer Map) via SignalR
            await _hubContext.Clients.Group($"Trip_{id}").SendAsync("ReceiveLocationUpdate", new {
                booking.CurrentLat,
                booking.CurrentLng,
                update.Speed,
                timestamp = booking.LastLocationUpdate
            });

            return Ok();
        }

        [HttpPost("trips/{id}/expenses")]
        public async Task<IActionResult> AddExpense(long id, [FromBody] Expense expense)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            expense.BookingId = id;
            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Expense recorded successfully" });
        }
    }

    public class TripStatusUpdateRequest { public string Status { get; set; } = string.Empty; public int Kms { get; set; } }
    public class LocationUpdate { public double Lat { get; set; } public double Lng { get; set; } public double Speed { get; set; } }
}
