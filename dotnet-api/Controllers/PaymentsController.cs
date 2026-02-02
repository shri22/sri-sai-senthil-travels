using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;
using Razorpay.Api;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly S3T.Api.Services.INotificationService _notificationService;
        private readonly IConfiguration _config;

        public PaymentsController(AppDbContext context, S3T.Api.Services.INotificationService notificationService, IConfiguration config)
        {
            _context = context;
            _notificationService = notificationService;
            _config = config;
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] PaymentConfirmationRequest request)
        {
            var booking = await _context.Bookings.FindAsync(request.BookingId);
            if (booking == null) return NotFound();

            try 
            {
                // Verify Razorpay Signature
                string secret = _config["Razorpay:Secret"] ?? "";
                
                Dictionary<string, string> attributes = new Dictionary<string, string>();
                attributes.Add("razorpay_payment_id", request.RazorpayPaymentId);
                attributes.Add("razorpay_order_id", request.RazorpayOrderId);
                attributes.Add("razorpay_signature", request.RazorpaySignature);

                Utils.verifyPaymentSignature(attributes);

                // If verification succeeds, update booking
                booking.PaymentId = request.RazorpayPaymentId;
                booking.Status = "Confirmed";
                
                await _context.SaveChangesAsync();

                // Send WhatsApp Notification
                var message = $"Namaste {booking.CustomerName}! Your Sri Sai Senthil heritage journey is confirmed. Invoice: #{booking.Id}. We look forward to seeing you on {booking.TravelDate:dd MMM}.";
                await _notificationService.SendWhatsAppMessageAsync(booking.CustomerPhone ?? "", message);

                return Ok(new { message = "Payment verified and booking confirmed." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Payment verification failed: " + ex.Message });
            }
        }

        [HttpGet("initiate/{bookingId}")]
        public async Task<IActionResult> InitiatePayment(long bookingId)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();

            try 
            {
                string key = _config["Razorpay:Key"] ?? "";
                string secret = _config["Razorpay:Secret"] ?? "";

                RazorpayClient client = new RazorpayClient(key, secret);

                Dictionary<string, object> options = new Dictionary<string, object>();
                options.Add("amount", (int)(booking.AdvancePaid * 100)); // Amount in paisa
                options.Add("currency", "INR");
                options.Add("receipt", booking.Id.ToString());

                Order order = client.Order.Create(options);
                string orderId = order["id"].ToString();

                return Ok(new { 
                    orderId, 
                    amount = booking.AdvancePaid * 100,
                    currency = "INR",
                    key = key
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Failed to initiate Razorpay order: " + ex.Message });
            }
        }
    }

    public class PaymentConfirmationRequest 
    { 
        public long BookingId { get; set; } 
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }
}
