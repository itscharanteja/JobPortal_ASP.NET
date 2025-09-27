import React, { useState, useCallback, useMemo } from "react";
import { Container, Typography, Box, Alert, Snackbar } from "@mui/material";
import JobFiltersHorizontal from "../components/jobs/JobFiltersHorizontal";
import JobList from "../components/jobs/JobList";
import AdminJobList from "../components/jobs/AdminJobList";
import { useAuth } from "../hooks/useAuth";

const Jobs = () => {
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { user } = useAuth();

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [filters]);

  // Memoize sort values
  const memoizedSortBy = useMemo(() => sortBy, [sortBy]);
  const memoizedSortOrder = useMemo(() => sortOrder, [sortOrder]);

  // Helper function to check if user is admin
  const isAdmin = useCallback((user) => {
    if (!user) return false;
    const roles = user.roles || user.Roles || [];
    return (
      roles.includes("Admin") || user.role === "Admin" || user.Role === "Admin"
    );
  }, []);

  const userIsAdmin = isAdmin(user);

  const handleJobApply = useCallback((jobId) => {
    console.log("Applied to job:", jobId);
    setSnackbar({
      open: true,
      message: "Application submitted successfully!",
      severity: "success",
    });
  }, []);

  const handleJobViewDetails = useCallback((jobId) => {
    // Navigate to job details page
    // This would typically use React Router
    console.log("Viewing job details for:", jobId);
    // Example: navigate(`/jobs/${jobId}`);
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Memoize the FiltersComponent to prevent recreation on every render
  const FiltersComponent = useMemo(() => (
    <JobFiltersHorizontal
      onFilterChange={handleFilterChange}
      onSortChange={handleSortChange}
      initialFilters={memoizedFilters}
    />
  ), [handleFilterChange, handleSortChange, memoizedFilters]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {userIsAdmin ? "Manage Your Job Postings" : "Find Your Dream Job"}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {userIsAdmin
            ? "View and manage your job postings and applications"
            : "Discover opportunities that match your skills and career goals"}
        </Typography>
      </Box>

      {/* Role-based messaging */}
      {userIsAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You're viewing as an Administrator. Here are your posted jobs and
          their applications.
        </Alert>
      )}

      {userIsAdmin ? (
        // Admin view - show posted jobs with applicant management
        <AdminJobList />
      ) : (
        // Job seeker view - show job search with horizontal filters
        <Box>
          {/* Horizontal Filters at Top */}
          {FiltersComponent}

          {/* Job List */}
          <JobList
            filters={memoizedFilters}
            sortBy={memoizedSortBy}
            sortOrder={memoizedSortOrder}
            onJobApply={handleJobApply}
            onJobViewDetails={handleJobViewDetails}
          />
        </Box>
      )}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Jobs;
