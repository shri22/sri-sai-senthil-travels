using Microsoft.AspNetCore.Mvc;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api")]
public class HealthController : ControllerBase
{
    [HttpGet]
    [HttpGet("health")]
    public IActionResult GetStatus()
    {
        return Ok(new { 
            status = "Healthy", 
            timestamp = DateTime.UtcNow,
            version = "1.0.0",
            message = "Sri Sai Senthil Travels API is operational"
        });
    }
}
