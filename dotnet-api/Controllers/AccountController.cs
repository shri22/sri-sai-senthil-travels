using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using S3T.Api.Data;
using S3T.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace S3T.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AccountController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpGet("me")]
        public async Task<ActionResult<object>> GetMe()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return NotFound();

            return Ok(new { 
                user.Id, 
                user.Email, 
                user.Name, 
                user.Role, 
                user.JoinedAt, 
                user.Phone,
                user.CompanyName,
                user.Address
            });
        }

        [HttpPut("update-profile")]
        public async Task<ActionResult<object>> UpdateProfile(UpdateProfileRequest request)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(request.CompanyName)) user.CompanyName = request.CompanyName;
            if (!string.IsNullOrEmpty(request.Address)) user.Address = request.Address;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully" });
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { error = "Invalid email or password" });
            }

            if (user.Status != "Active")
            {
                return BadRequest(new { error = $"Your account status is: {user.Status}" });
            }

            var token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Id, user.Email, user.Name, user.Role } });
        }

        [HttpPost("register")]
        public async Task<ActionResult<object>> Register(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { error = "Email already in use" });
            }

            var user = new User
            {
                Email = request.Email,
                Name = request.Name,
                CompanyName = request.CompanyName, 
                Address = request.Address,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role ?? "Customer",
                Phone = request.Phone,
                Status = (request.Role == "Partner") ? "Pending" : "Active"
            };

            // For partners, if Company Name is empty, fallback to Name
            if (user.Role == "Partner" && string.IsNullOrEmpty(user.CompanyName)) {
                user.CompanyName = user.Name; 
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Id, user.Email, user.Name, user.Role } });
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "a_very_long_and_secure_secret_key_12345"));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Important: For Partners, the 'Name' claim represents the Company/Agency Name usage in the system
            var identityName = (user.Role == "Partner" && !string.IsNullOrEmpty(user.CompanyName)) 
                ? user.CompanyName 
                : user.Name;

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, identityName), 
                new Claim(ClaimTypes.MobilePhone, user.Phone ?? "9443856913")
            };

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
    public class RegisterRequest { 
        public string Email { get; set; } = string.Empty; 
        public string Name { get; set; } = string.Empty; 
        public string CompanyName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; 
        public string? Role { get; set; }
        public string? Phone { get; set; }
    }
    public class UpdateProfileRequest {
        public string? CompanyName { get; set; }
        public string? Address { get; set; }
    }
}
