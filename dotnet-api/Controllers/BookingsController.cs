using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly S3T.Api.Services.INotificationService _notificationService;

        public BookingsController(AppDbContext context, S3T.Api.Services.INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyBookings()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email)) return Unauthorized();

            var bookings = await _context.Bookings
                .Where(b => b.CustomerEmail == email)
                .OrderByDescending(b => b.TravelDate)
                .Select(b => new {
                    b.Id,
                    b.CustomerName,
                    b.PickupFrom,
                    Destination = b.DestinationTo,
                    Date = b.TravelDate.ToString("yyyy-MM-dd"),
                    b.Status,
                    b.AdvancePaid,
                    b.TotalAmount,
                    VehicleName = _context.Vehicles.Where(v => v.Id == b.VehicleId).Select(v => v.Name).FirstOrDefault() ?? "Heritage Fleet"
                })
                .ToListAsync();

            return Ok(bookings);
        }

        [HttpGet("settings")]
        public async Task<ActionResult<object>> GetSettings()
        {
            var configs = await _context.SystemConfigs.ToListAsync();
            return configs.ToDictionary(c => c.Key, c => c.Value);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetAvailableVehicles(
            [FromQuery] DateTime? travelDate, 
            [FromQuery] DateTime? endDate,
            [FromQuery] string? terrain,
            [FromQuery] string? vehicleType, // Car, Van, Mini Bus, Bus
            [FromQuery] bool? hasAc,
            [FromQuery] string? sortBy) // price_asc, rating_desc
        {
            var query = _context.Vehicles.Include(v => v.BlockedDates).AsQueryable();

            // 1. Availability Filter (Improved for Range)
            if (travelDate.HasValue)
            {
                var start = travelDate.Value.Date;
                var end = endDate?.Date ?? start;
                
                query = query.Where(v => !v.BlockedDates.Any(bd => bd.BlockedDate.Date >= start && bd.BlockedDate.Date <= end));
            }

            // 2. Terrain Filter
            if (!string.IsNullOrEmpty(terrain) && terrain.ToLower() == "hills")
            {
                query = query.Where(v => v.Terrain == "all");
            }

            // 3. Vehicle Type Filter
            if (!string.IsNullOrEmpty(vehicleType))
            {
                query = query.Where(v => v.Type.ToLower() == vehicleType.ToLower());
            }


            // 4. AC Filter
            if (hasAc.HasValue)
            {
                query = query.Where(v => v.HasAc == hasAc.Value);
            }

            var results = await query.ToListAsync();

            // 5. Sorting (Done on client side because SQLite doesn't support 'decimal' in ORDER BY)
            results = sortBy switch
            {
                "price_asc" => results.OrderBy(v => v.BasePrice).ToList(),
                "rating_desc" => results.OrderByDescending(v => v.AverageRating).ToList(),
                _ => results.OrderBy(v => v.Id).ToList()
            };

            return results;
        }

        [HttpPost]
        public async Task<ActionResult<Booking>> CreateBooking(Booking booking)
        {
            // 1. Transaction to ensure data integrity
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 2. Check availability again (Concurrency check)
                var start = booking.TravelDate.Date;
                var end = booking.EndDate?.Date ?? start;

                var isBlocked = await _context.VehicleBlockedDates.AnyAsync(bd => 
                    bd.VehicleId == booking.VehicleId && 
                    bd.BlockedDate.Date >= start && bd.BlockedDate.Date <= end);

                if (isBlocked)
                {
                    return BadRequest(new { error = "Vehicle already reserved for one or more dates in this range." });
                }

                // 3. Save Booking
                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                // 4. Block the dates in range
                for (var date = start; date <= end; date = date.AddDays(1))
                {
                    _context.VehicleBlockedDates.Add(new VehicleBlockedDate
                    {
                        VehicleId = booking.VehicleId,
                        BlockedDate = date,
                        BookingId = booking.Id,
                        Reason = "Customer Booking"
                    });
                }
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while processing the reservation.");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Booking>> GetBooking(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();
            return booking;
        }

        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> DownloadInvoice(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);

            // QuestPDF License (Community)
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

            var pdf = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(50);
                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("SRI SAI SENTHIL TRAVELS").FontSize(24).SemiBold().FontColor("#D4AF37");
                            col.Item().Text("Heritage Transport Solutions Since 1987").FontSize(10).Italic();
                        });
                        row.RelativeItem().AlignRight().Column(col =>
                        {
                            col.Item().Text($"INVOICE #{booking.Id}").FontSize(14).SemiBold();
                            col.Item().Text($"Date: {booking.CreatedAt:dd MMM yyyy}").FontSize(10);
                        });
                    });

                    page.Content().PaddingVertical(25).Column(col =>
                    {
                        col.Item().PaddingBottom(5).Text("RESERVATION DETAILS").FontSize(12).SemiBold().FontColor("#D4AF37");
                        col.Item().LineHorizontal(1).LineColor("#D4AF37");

                        col.Item().PaddingTop(10).Row(row =>
                        {
                            row.RelativeItem().Column(c => {
                                c.Item().Text("CLIENT").FontSize(10).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                c.Item().Text(booking.CustomerName).Bold();
                                c.Item().Text(booking.CustomerEmail);
                            });
                            row.RelativeItem().Column(c => {
                                c.Item().Text("VEHICLE").FontSize(10).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                c.Item().Text(vehicle?.Name ?? "Heritage Coach").Bold();
                                c.Item().Text(vehicle?.Number ?? "");
                            });
                        });

                        col.Item().PaddingTop(20).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Description").SemiBold();
                                header.Cell().AlignRight().Text("Rate").SemiBold();
                                header.Cell().AlignRight().Text("Total").SemiBold();
                            });

                            table.Cell().Text($"Heritage Trip: {booking.PickupFrom} to {booking.DestinationTo}");
                            table.Cell().AlignRight().Text($"{booking.DistanceKm} KM");
                            table.Cell().AlignRight().Text($"₹{booking.TotalAmount:N2}");
                        });

                        col.Item().PaddingTop(30).AlignRight().Column(c =>
                        {
                            c.Item().Text($"Subtotal: ₹{booking.TotalAmount:N2}").FontSize(10);
                            c.Item().Text($"Advance Paid: ₹{booking.AdvancePaid:N2}").FontSize(10);
                            c.Item().Text($"Balance Due: ₹{(booking.TotalAmount - booking.AdvancePaid):N2}").FontSize(14).Bold().FontColor("#D4AF37");
                        });
                    });

                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Thank you for choosing Sri Sai Senthil Travels. Have a safe heritage journey.").FontSize(10).Italic();
                    });
                });
            }).GeneratePdf();
            return File(pdf, "application/pdf", $"Invoice_{booking.Id}.pdf");
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            if (booking.Status == "Completed" || booking.Status == "Cancelled")
                return BadRequest(new { error = "Cannot cancel this trip." });

            booking.Status = "Cancelled";
            booking.CancellationDate = DateTime.UtcNow;

            // Logic: Refund 50% of Advance if cancelled within 24 hours of travel
            var hoursUntilTravel = (booking.TravelDate - DateTime.UtcNow).TotalHours;
            if (hoursUntilTravel > 24) {
                booking.RefundAmount = booking.AdvancePaid; // Full refund
            } else {
                booking.RefundAmount = booking.AdvancePaid * 0.5m; // 50% penalty
            }

            // Unblock the date
            var blockedDate = await _context.VehicleBlockedDates
                .FirstOrDefaultAsync(bd => bd.BookingId == id);
            if (blockedDate != null) _context.VehicleBlockedDates.Remove(blockedDate);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Trip cancelled successfully", refund = booking.RefundAmount });
        }

        [HttpPost("{id}/review")]
        public async Task<IActionResult> SubmitReview(long id, [FromBody] ReviewRequest request)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null || booking.Status != "Completed") 
                return BadRequest(new { error = "Can only review completed trips." });

            booking.Rating = request.Rating;
            booking.Feedback = request.Comment;

            var review = new Review
            {
                VehicleId = booking.VehicleId,
                CustomerName = booking.CustomerName,
                Rating = request.Rating,
                Comment = request.Comment
            };

            _context.Reviews.Add(review);

            // Update Vehicle Average Rating
            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            if (vehicle != null)
            {
                var allRatings = await _context.Reviews
                    .Where(r => r.VehicleId == vehicle.Id)
                    .Select(r => r.Rating)
                    .ToListAsync();
                allRatings.Add(request.Rating);
                vehicle.AverageRating = allRatings.Average();
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Review submitted. Thank you!" });
        }

        [HttpPost("{id}/expenses")]
        public async Task<IActionResult> AddExpense(long id, [FromBody] Expense expense)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            expense.BookingId = id;
            expense.CreatedAt = DateTime.UtcNow;
            
            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();
            
            return Ok(expense);
        }
    }

    public class ReviewRequest { public int Rating { get; set; } public string Comment { get; set; } = string.Empty; }
}
