import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Avatar,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  LocationOn,
  Work,
  Schedule,
  AttachMoney,
  Business,
  Warning,
} from "@mui/icons-material";

const JobCard = ({
  job,
  onApply,
  onViewDetails,
  isApplied = false,
  hasResume = false,
  onResumeUpload,
}) => {
  const getJobTypeColor = (type) => {
    const colors = {
      FullTime: "success",
      "Full-time": "success",
      PartTime: "warning",
      "Part-time": "warning",
      Contract: "info",
      Internship: "secondary",
      Remote: "primary",
    };
    return colors[type] || "default";
  };

  const formatJobType = (type) => {
    const typeMap = {
      FullTime: "Full-time",
      PartTime: "Part-time",
      Contract: "Contract",
      Internship: "Internship",
    };
    return typeMap[type] || type;
  };

  const formatExperienceLevel = (level) => {
    const levelMap = {
      EntryLevel: "Entry Level",
      MidLevel: "Mid Level",
      SeniorLevel: "Senior Level"
    };
    return levelMap[level] || level;
  };

  const formatPostedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Company and Logo */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            sx={{ mr: 2, bgcolor: "primary.main" }}
            src={job.company?.logoUrl}
          >
            <Business />
          </Avatar>
          <Box>
            <Typography variant="h6" component="h3" noWrap>
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job.companyName || "Company Name"}
            </Typography>
          </Box>
        </Box>

        {/* Job Details */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {job.location}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AttachMoney fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {job.salary
                ? `$${job.salary.toLocaleString()}`
                : "Salary not specified"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Posted {formatPostedDate(job.createdAt)}
            </Typography>
          </Box>
        </Stack>

        {/* Job Type and Status Chips */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={formatJobType(job.jobType)}
            size="small"
            color={getJobTypeColor(job.jobType)}
          />
          {job.experienceLevel && (
            <Chip
              label={formatExperienceLevel(job.experienceLevel)}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          {job.location?.toLowerCase().includes("remote") && (
            <Chip
              label="Remote"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Job Description Preview */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {job.description}
        </Typography>

        {/* Skills/Requirements */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Required Skills:
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {job.requiredSkills.slice(0, 3).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              ))}
              {job.requiredSkills.length > 3 && (
                <Chip
                  label={`+${job.requiredSkills.length - 3} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button
          size="small"
          onClick={() => onViewDetails(job.id)}
          color="primary"
        >
          View Details
        </Button>

        {!hasResume ? (
          <Tooltip title="Upload your resume first to apply for jobs">
            <Button
              variant="outlined"
              size="small"
              onClick={onResumeUpload}
              startIcon={<Warning />}
              color="warning"
            >
              Upload Resume
            </Button>
          </Tooltip>
        ) : (
          <Button
            variant={isApplied ? "outlined" : "contained"}
            size="small"
            onClick={() => onApply(job.id)}
            disabled={isApplied}
            color="primary"
          >
            {isApplied ? "Applied" : "Apply Now"}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default JobCard;
