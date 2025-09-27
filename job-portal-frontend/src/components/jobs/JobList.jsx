import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import JobCard from "./JobCard";
import { jobsService } from "../../services/jobsService";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const JobList = ({
  filters,
  sortBy: externalSortBy,
  sortOrder: externalSortOrder,
  onJobApply,
  onJobViewDetails,
}) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(0);
  const sortBy = externalSortBy || "createdAt";
  const sortOrder = externalSortOrder || "desc";
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const { user, resumeStatus } = useAuth();
  const navigate = useNavigate();
  const itemsPerPage = 12;
  const prevFiltersRef = useRef();
  const isInitialMount = useRef(true);

  const fetchJobs = useCallback(
    async (currentFilters) => {
      try {
        setLoading(true);
        setError(null);

        // Map frontend filters to backend API parameters
        const params = {
          page,
          pageSize: itemsPerPage,
          sortBy,
          sortOrder,
          // Search and location
          searchQuery: currentFilters.searchQuery || undefined,
          location: currentFilters.location || undefined,
          // Job properties
          jobType: currentFilters.jobType || undefined,
          experienceLevel: currentFilters.experienceLevel || undefined,
          // Salary range
          minSalary:
            currentFilters.salaryMin > 0 ? currentFilters.salaryMin : undefined,
          maxSalary:
            currentFilters.salaryMax < 200000
              ? currentFilters.salaryMax
              : undefined,
          // Company properties
          companySize: currentFilters.companySize || undefined,
          industry: currentFilters.industry || undefined,
          // Remote work
          isRemote: currentFilters.isRemote || undefined,
          // Skills array
          skills:
            currentFilters.skills && currentFilters.skills.length > 0
              ? currentFilters.skills.join(",")
              : undefined,
        };

        // Remove empty filter values
        Object.keys(params).forEach((key) => {
          if (
            params[key] === "" ||
            params[key] === null ||
            params[key] === undefined ||
            (Array.isArray(params[key]) && params[key].length === 0) ||
            (typeof params[key] === "string" && params[key].trim() === "")
          ) {
            delete params[key];
          }
        });

        console.log("Fetching jobs with params:", params); // Debug log
        const response = await jobsService.getJobs(params);

        // Handle the API response structure: { success: true, data: { items: [...], totalCount: 27, ... } }
        const jobsData = response.data || response;
        let jobItems = jobsData.items || [];

        // Apply client-side sorting as fallback if backend sorting isn't working properly
        if (sortBy && sortOrder) {
          jobItems = [...jobItems].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle different data types
            if (sortBy === 'createdAt') {
              aValue = new Date(aValue);
              bValue = new Date(bValue);
            } else if (typeof aValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            } else if (typeof aValue === 'number') {
              aValue = aValue || 0;
              bValue = bValue || 0;
            }

            // Compare values
            let comparison = 0;
            if (aValue > bValue) {
              comparison = 1;
            } else if (aValue < bValue) {
              comparison = -1;
            }

            // Apply sort order
            return sortOrder === 'desc' ? comparison * -1 : comparison;
          });
        }

        setJobs(jobItems);
        setTotalPages(jobsData.totalPages || 1);
        setTotalJobs(jobsData.totalCount || 0);
        setCurrentPageSize(jobsData.pageSize || itemsPerPage);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again.");
        // Reset jobs on error to show clean state
        setJobs([]);
        setTotalPages(0);
        setTotalJobs(0);
      } finally {
        setLoading(false);
      }
    },
    [page, sortBy, sortOrder]
  );

  // Effect to handle filter changes, page changes, and sort changes
  useEffect(() => {
    const filtersString = JSON.stringify(filters);
    const prevFiltersString = JSON.stringify(prevFiltersRef.current);
    const filtersChanged = filtersString !== prevFiltersString;

    console.log("useEffect triggered:", {
      page,
      sortBy,
      sortOrder,
      filtersChanged,
      isInitialMount: isInitialMount.current,
      filters: filtersString,
    }); // Debug log

    if (isInitialMount.current) {
      // Initial load
      console.log("Initial load triggered"); // Debug log
      isInitialMount.current = false;
      prevFiltersRef.current = filters;
      fetchJobs(filters);
    } else if (filtersChanged) {
      // Filters changed - reset to page 1 and fetch
      console.log("Filters changed, resetting page"); // Debug log
      prevFiltersRef.current = filters;
      if (page !== 1) {
        setPage(1); // This will trigger another useEffect call with page = 1
      } else {
        fetchJobs(filters);
      }
    } else {
      // Only page or sort changed - fetch with current filters
      console.log("Page or sort changed, fetching jobs for page", page, "sortBy", sortBy, "sortOrder", sortOrder); // Debug log
      fetchJobs(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, sortBy, sortOrder]); // Add sortBy and sortOrder to dependencies

  useEffect(() => {
    const isJobSeeker =
      user?.roles?.includes("JobSeeker") ||
      user?.Roles?.includes("JobSeeker") ||
      user?.userType === "JobSeeker" ||
      user?.UserType === "JobSeeker" ||
      user?.role === "JobSeeker";

    if (isJobSeeker) {
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchAppliedJobs = async () => {
    try {
      const response = await jobsService.getAppliedJobs();
      const applications =
        response?.data?.items || response?.items || response || [];
      const appliedJobIds = new Set(
        applications.map((application) => application.jobId)
      );
      setAppliedJobs(appliedJobIds);
    } catch (err) {
      console.error("Error fetching applied jobs:", err);
    }
  };

  const handleResumeUpload = () => {
    setShowResumeDialog(true);
  };

  const handlePageChange = (event, newPage) => {
    console.log("Page changing from", page, "to", newPage); // Debug log
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = async (jobId) => {
    try {
      await jobsService.applyToJob(jobId);
      setAppliedJobs((prev) => new Set([...prev, jobId]));
      if (onJobApply) {
        onJobApply(jobId);
      }
    } catch (err) {
      console.error("Error applying to job:", err);
      // You might want to show a toast notification here
    }
  };

  const handleViewDetails = (jobId) => {
    if (onJobViewDetails) {
      onJobViewDetails(jobId);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Results Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {totalJobs > 0
            ? `Showing ${Math.min(
                (page - 1) * currentPageSize + 1,
                totalJobs
              )}-${Math.min(
                (page - 1) * currentPageSize + jobs.length,
                totalJobs
              )} of ${totalJobs} jobs`
            : "No jobs found"}
        </Typography>
      </Box>

      {/* Job Grid */}
      {jobs.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} lg={4} key={job.id}>
                <JobCard
                  job={job}
                  onApply={handleApply}
                  onViewDetails={handleViewDetails}
                  isApplied={appliedJobs.has(job.id)}
                  hasResume={resumeStatus?.hasResume || false}
                  onResumeUpload={handleResumeUpload}
                />
              </Grid>
            ))}
          </Grid>

          {/* Fixed height container for loading and pagination */}
          <Box sx={{ minHeight: 80, mt: 4, position: "relative" }}>
            {/* Loading overlay */}
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  opacity: 0.8,
                }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            )}

            {/* Pagination - always visible but disabled during loading */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  opacity: loading ? 0.5 : 1,
                  pointerEvents: loading ? "none" : "auto",
                  transition: "opacity 0.3s ease",
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  disabled={loading}
                />
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: "text.secondary",
          }}
        >
          <Typography variant="h6" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body2">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}

      {/* Resume Required Dialog */}
      <Dialog
        open={showResumeDialog}
        onClose={() => setShowResumeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resume Required</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You need to upload your resume before you can apply to jobs.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Go to your profile page to upload your resume, then return here to
            apply for jobs.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResumeDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowResumeDialog(false);
              navigate("/profile");
            }}
          >
            Go to Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobList;
