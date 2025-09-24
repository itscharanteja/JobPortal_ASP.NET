namespace JobPortalApi.DTOs;

public class DashboardStatsDTO
{
    public int TotalJobsApplied { get; set; }
    public int JobsUnderReview { get; set; }
    public int JobsShortlisted { get; set; }
    public int JobsRejected { get; set; }
    public int TotalJobsPosted { get; set; }  // For recruiters
    public int TotalActiveJobs { get; set; }  // For recruiters
    public Dictionary<string, int> ApplicationsByStatus { get; set; } = new();
    public List<RecentActivityDTO> RecentActivities { get; set; } = new();
}

public class RecentActivityDTO
{
    public required string ActivityType { get; set; }  // "Applied", "StatusChanged", "JobPosted", etc.
    public required string Description { get; set; }
    public DateTime Timestamp { get; set; }
    public required string JobTitle { get; set; }
    public required string CompanyName { get; set; }
}