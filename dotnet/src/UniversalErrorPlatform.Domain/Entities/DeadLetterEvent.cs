namespace UniversalErrorPlatform.Domain.Entities;

public class DeadLetterEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ErrorGroupId { get; set; }
    public Guid? IntegrationId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public string FailureReason { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
