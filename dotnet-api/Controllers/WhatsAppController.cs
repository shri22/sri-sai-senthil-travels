using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WhatsAppController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WhatsAppController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleIncomingMessage([FromBody] WhatsAppIncomingMessage message)
        {
            // Simplified logic for "Hi" or "Status"
            string body = message.Text.ToLower();
            string phone = message.From;

            if (body.Contains("hi") || body.Contains("namaste"))
            {
                // Check if sender is a Customer
                var customer = await _context.Users.FirstOrDefaultAsync(u => u.Phone == phone && u.Role == "Customer");
                if (customer != null)
                {
                    var bookings = await _context.Bookings
                        .Where(b => b.CustomerPhone == phone && b.Status != "Cancelled")
                        .OrderByDescending(b => b.TravelDate)
                        .Take(3)
                        .ToListAsync();

                    if (!bookings.Any())
                        return Ok(new { response = $"Namaste {customer.Name}! You have no active heritage journeys. Visit our site to book one!" });

                    string reply = $"Namaste {customer.Name}! Here are your journey details:\n";
                    foreach (var b in bookings)
                    {
                        reply += $"📍 {b.DestinationTo} on {b.TravelDate:dd MMM} - Status: {b.Status}\n";
                    }
                    return Ok(new { response = reply });
                }

                // Check if sender is a Partner
                var partner = await _context.Users.FirstOrDefaultAsync(u => u.Phone == phone && u.Role == "Partner");
                if (partner != null)
                {
                    var bookings = await _context.Bookings
                        .Join(_context.Vehicles, b => b.VehicleId, v => v.Id, (b, v) => new { b, v })
                        .Where(x => x.v.Company == partner.Name && x.b.Status != "Cancelled")
                        .OrderByDescending(x => x.b.TravelDate)
                        .Take(3)
                        .ToListAsync();

                    string reply = $"Pranam Master {partner.Name}! Operational Summary:\n";
                    if (!bookings.Any()) reply += "No active trips assigned to your fleet currently.";
                    foreach (var x in bookings)
                    {
                        reply += $"🚐 {x.v.Name}: {x.b.CustomerName} to {x.b.DestinationTo} on {x.b.TravelDate:dd MMM}\n";
                    }
                    return Ok(new { response = reply });
                }
            }

            return Ok(new { response = "I didn't quite get that. Try saying 'Hi' to see your heritage summary." });
        }
    }

    public class WhatsAppIncomingMessage { public string From { get; set; } = string.Empty; public string Text { get; set; } = string.Empty; }
}
