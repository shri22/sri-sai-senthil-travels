using Microsoft.AspNetCore.SignalR;

namespace S3T.Api.Hubs
{
    public class TrackingHub : Hub
    {
        // Clients can join a 'room' for a specific booking/vehicle
        public async Task JoinTripGroup(string bookingId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Trip_{bookingId}");
        }

        // Method for the vehicle's GPS device/driver app to send updates
        public async Task UpdateLocation(string bookingId, double lat, double lng, double speed)
        {
            await Clients.Group($"Trip_{bookingId}").SendAsync("ReceiveLocationUpdate", new { 
                lat, 
                lng, 
                speed, 
                timestamp = DateTime.UtcNow 
            });
        }
    }
}
