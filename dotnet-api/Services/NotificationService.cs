namespace S3T.Api.Services
{
    public interface INotificationService
    {
        Task SendWhatsAppMessageAsync(string phone, string message);
        Task SendPushNotificationAsync(string deviceToken, string title, string body);
    }

    public class WhatsAppNotificationService : INotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public WhatsAppNotificationService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        public async Task SendWhatsAppMessageAsync(string phone, string message)
        {
            // Placeholder for Meta API
            Console.WriteLine($"[WHATSAPP SENT TO {phone}]: {message}");
            await Task.CompletedTask;
        }

        public async Task SendPushNotificationAsync(string deviceToken, string title, string body)
        {
            // Placeholder for Firebase Cloud Messaging (FCM)
            Console.WriteLine($"[PUSH SENT TO {deviceToken}]: {title} - {body}");
            await Task.CompletedTask;
        }
    }
}
