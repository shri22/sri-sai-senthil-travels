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
                // 2. Check availability only if VehicleId is provided
                if (booking.VehicleId.HasValue && booking.VehicleId.Value > 0)
                {
                    var start = booking.TravelDate.Date;
                    var end = booking.EndDate?.Date ?? start;

                    var isBlocked = await _context.VehicleBlockedDates.AnyAsync(bd => 
                        bd.VehicleId == booking.VehicleId.Value && 
                        bd.BlockedDate.Date >= start && bd.BlockedDate.Date <= end);

                    if (isBlocked)
                    {
                        return BadRequest(new { error = "Vehicle already reserved for one or more dates in this range." });
                    }

                    // 3. Save Booking
                    _context.Bookings.Add(booking);
                    await _context.SaveChangesAsync();

                    // 4. Block the dates in range (only if vehicle is assigned)
                    for (var date = start; date <= end; date = date.AddDays(1))
                    {
                        _context.VehicleBlockedDates.Add(new VehicleBlockedDate
                        {
                            VehicleId = booking.VehicleId.Value,
                            BlockedDate = date,
                            BookingId = booking.Id,
                            Reason = "Customer Booking"
                        });
                    }
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // No vehicle assigned yet - just save the booking
                    _context.Bookings.Add(booking);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while processing the reservation.");
            }
        }

        [HttpGet("{id}/agreement")]
        public async Task<IActionResult> DownloadAgreement(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId);
            
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

            var pdf = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);
                    
                    var companyName = vehicle?.Company ?? "SRI SAI SENTHIL TRAVELS";
                    if (companyName == "S3T") companyName = "SRI SAI SENTHIL TRAVELS";

                    // Header with Branding
                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text(companyName.ToUpper()).FontSize(22).ExtraBold().FontColor("#D4AF37");
                            col.Item().Text(companyName == "SRI SAI SENTHIL TRAVELS" ? "Heritage & Premium Transport Services" : "Elite Heritage Partner").FontSize(9).SemiBold();
                            col.Item().Text(companyName == "SRI SAI SENTHIL TRAVELS" ? "Shed No 4, Heritage Colony, Madurai - 625001" : "Heritage Managed Fleet").FontSize(8);
                            col.Item().Text(companyName == "SRI SAI SENTHIL TRAVELS" ? "GSTIN: 33AAAAA0000A1Z5 | Phone: +91 94438 56913" : $"Heritage Booking ID: S3T-{booking.Id}").FontSize(8);
                        });
                        row.ConstantItem(100).AlignRight().Column(col => {
                           col.Item().Padding(5).Border(1).BorderColor("#D4AF37").AlignCenter().Text("BOOKING AGREEMENT").FontSize(10).Bold();
                           col.Item().PaddingTop(5).AlignRight().Text($"ID: S3T-{booking.Id}").FontSize(8);
                           col.Item().AlignRight().Text($"{DateTime.Now:dd/MM/yyyy}").FontSize(8);
                        });
                    });

                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        // Booking Table
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).Padding(5).Column(c => {
                                c.Item().Text("CLIENT DETAILS").FontSize(8).Bold().FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                c.Item().Text(booking.CustomerName).Bold();
                                c.Item().Text(booking.CustomerPhone).FontSize(9);
                                c.Item().Text(booking.CustomerAddress ?? "N/A").FontSize(8);
                            });

                            table.Cell().BorderBottom(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).Padding(5).Column(c => {
                                c.Item().Text("VEHICLE & JOURNEY").FontSize(8).Bold().FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                c.Item().Text($"{vehicle?.Name} ({vehicle?.Number})").Bold();
                                c.Item().Text($"From: {booking.PickupFrom}").FontSize(9);
                                c.Item().Text($"To: {booking.DestinationTo}").FontSize(9);
                            });

                            table.Cell().Padding(5).Column(c => {
                                c.Item().Text("TRIP SCHEDULE").FontSize(8).Bold().FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                c.Item().Text($"Start: {booking.TravelDate:dd MMM yyyy}").FontSize(9);
                                c.Item().Text($"End: {booking.EndDate?.ToString("dd MMM yyyy") ?? "N/A"}").FontSize(9);
                                c.Item().Text($"Duration: {booking.NumDays} Day(s)").FontSize(9);
                            });

                            table.Cell().Padding(5).Column(c => {
                                c.Item().Text("FINANCIAL SUMMARY").FontSize(8).Bold().FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                c.Item().Text($"Total Package: ₹{booking.TotalAmount:N2}").Bold();
                                c.Item().Text($"Advance Paid: ₹{booking.AdvancePaid:N2}").FontSize(9).FontColor(QuestPDF.Helpers.Colors.Green.Medium);
                                c.Item().Text($"Balance Due: ₹{(booking.TotalAmount - booking.AdvancePaid):N2}").FontSize(10).Bold().FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                            });
                        });

                        // Terms and Conditions Section
                        col.Item().PaddingTop(25).Column(c => {
                            c.Item().Text("TERMS AND CONDITIONS (நிபந்தனைகள்)").FontSize(11).Bold().FontColor("#D4AF37");
                            c.Item().PaddingTop(5).Text("1. Toll, Parking, State Permit, and Hill Station Entry charges are extra unless specified.").FontSize(8);
                            c.Item().Text("2. Driver Bata is applicable for every calendar day or night stay as per current rates.").FontSize(8);
                            c.Item().Text("3. The starting and ending KM will be calculated from our office/garage.").FontSize(8);
                            c.Item().Text("4. Diesel rates are fixed based on current market prices. Significant hikes may reflect in final bill.").FontSize(8);
                            c.Item().Text("5. Booking is confirmed only upon payment of 25% advance amount.").FontSize(8);
                            c.Item().Text("6. Sri Sai Senthil Travels is not responsible for luggage loss or delay due to traffic/breakdowns.").FontSize(8);
                        });

                        // Signature Section
                        col.Item().PaddingTop(40).Row(row => {
                            row.RelativeItem().Column(c => {
                                c.Item().BorderTop(1).PaddingTop(5).AlignCenter().Text("Customer Signature").FontSize(8);
                            });
                            row.ConstantItem(100);
                            row.RelativeItem().Column(c => {
                                c.Item().BorderTop(1).PaddingTop(5).AlignCenter().Text($"For {companyName}").FontSize(8);
                            });
                        });
                    });

                    page.Footer().Column(c => {
                        c.Item().LineHorizontal(1).LineColor(QuestPDF.Helpers.Colors.Grey.Lighten2);
                        c.Item().PaddingTop(5).AlignCenter().Text(x => {
                            x.Span("This is a computer-generated document. No physical signature required.").FontSize(7).Italic();
                        });
                    });
                });
            }).GeneratePdf();

            return File(pdf, "application/pdf", $"Agreement_S3T_{booking.Id}.pdf");
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Booking>> GetBooking(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();
            return booking;
        }

        [HttpPut("{id}/assign-vehicle")]
        public async Task<IActionResult> AssignVehicle(long id, [FromBody] AssignVehicleRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var booking = await _context.Bookings.FindAsync(id);
                if (booking == null) return NotFound(new { error = "Booking not found" });

                var start = booking.TravelDate.Date;
                var end = booking.EndDate?.Date ?? start;

                // Check if new vehicle is available
                var isBlocked = await _context.VehicleBlockedDates.AnyAsync(bd => 
                    bd.VehicleId == request.VehicleId && 
                    bd.BlockedDate.Date >= start && bd.BlockedDate.Date <= end &&
                    bd.BookingId != id); // Exclude current booking's blocks

                if (isBlocked)
                {
                    return BadRequest(new { error = "Vehicle already reserved for one or more dates in this range." });
                }

                // Remove old vehicle blocks if vehicle was previously assigned
                if (booking.VehicleId.HasValue)
                {
                    var oldBlocks = await _context.VehicleBlockedDates
                        .Where(bd => bd.BookingId == id)
                        .ToListAsync();
                    _context.VehicleBlockedDates.RemoveRange(oldBlocks);
                }

                // Assign new vehicle
                booking.VehicleId = request.VehicleId;

                // Create new blocks for the assigned vehicle
                for (var date = start; date <= end; date = date.AddDays(1))
                {
                    _context.VehicleBlockedDates.Add(new VehicleBlockedDate
                    {
                        VehicleId = request.VehicleId,
                        BlockedDate = date,
                        BookingId = booking.Id,
                        Reason = "Customer Booking"
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Vehicle assigned successfully", booking });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { error = "Failed to assign vehicle", details = ex.Message });
            }
        }

        public class AssignVehicleRequest
        {
            public int VehicleId { get; set; }
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
                    var companyName = vehicle?.Company ?? "SRI SAI SENTHIL TRAVELS";
                    if (companyName == "S3T") companyName = "SRI SAI SENTHIL TRAVELS";

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text(companyName.ToUpper()).FontSize(24).SemiBold().FontColor("#D4AF37");
                            col.Item().Text(companyName == "SRI SAI SENTHIL TRAVELS" ? "Heritage Transport Solutions Since 1987" : "Heritage Managed Trip").FontSize(10).Italic();
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
                        t.Span($"Thank you for choosing {companyName}. Have a safe heritage journey.").FontSize(10).Italic();
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

            if (!booking.VehicleId.HasValue)
                return BadRequest(new { error = "Cannot review a trip without an assigned vehicle." });

            booking.Rating = request.Rating;
            booking.Feedback = request.Comment;

            var review = new Review
            {
                VehicleId = booking.VehicleId.Value,
                CustomerName = booking.CustomerName,
                Rating = request.Rating,
                Comment = request.Comment
            };

            _context.Reviews.Add(review);

            // Update Vehicle Average Rating
            var vehicle = await _context.Vehicles.FindAsync(booking.VehicleId.Value);
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

        [HttpPost("{id}/payment")]
        public async Task<IActionResult> AddPaymentLog(long id, [FromBody] PaymentLog payment)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            payment.BookingId = id;
            payment.PaymentDate = DateTime.UtcNow;
            
            // Add Payment Log
            _context.PaymentLogs.Add(payment);
            
            // Update Total Advance Paid
            booking.AdvancePaid += payment.Amount;
            
            // Check if fully paid
            if (booking.AdvancePaid >= booking.TotalAmount)
            {
                booking.BalanceStatus = "Paid";
            }
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Payment recorded", newBalance = booking.BalanceAmount });
        }
    }

    public class ReviewRequest { public int Rating { get; set; } public string Comment { get; set; } = string.Empty; }
}
