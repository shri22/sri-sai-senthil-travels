using System.Text.Json;

namespace S3T.Api.Services
{
    public interface IDistanceService
    {
        Task<int> GetDistanceAsync(string origin, string destination);
    }

    public class GoogleDistanceService : IDistanceService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public GoogleDistanceService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        public async Task<int> GetDistanceAsync(string origin, string destination)
        {
            var apiKey = _config["GoogleMaps:ApiKey"];
            if (string.IsNullOrEmpty(apiKey)) return 100; // Fallback if no key provided

            var url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={Uri.EscapeDataString(origin)}&destinations={Uri.EscapeDataString(destination)}&key={apiKey}";
            
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return 100;

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            
            var root = doc.RootElement;
            if (root.GetProperty("status").GetString() == "OK")
            {
                var distanceValue = root.GetProperty("rows")[0].GetProperty("elements")[0].GetProperty("distance").GetProperty("value").GetInt32();
                return distanceValue / 1000; // Convert meters to KM
            }

            return 100;
        }
    }
}
