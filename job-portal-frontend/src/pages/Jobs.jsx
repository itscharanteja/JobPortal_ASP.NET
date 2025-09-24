import React, { useState, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
  Fab,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from "@mui/material";
import { FilterList, Close } from "@mui/icons-material";
import JobFilters from "../components/jobs/JobFilters";
import JobList from "../components/jobs/JobList";
import { useAuth } from "../hooks/useAuth";

const Jobs = () => {
  const [filters, setFilters] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

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

  const FiltersComponent = () => (
    <JobFilters
      onFilterChange={handleFilterChange}
      initialFilters={memoizedFilters}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Find Your Dream Job
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Discover opportunities that match your skills and career goals
        </Typography>
      </Box>

      {/* Role-based messaging */}
      {user?.role === "Recruiter" && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You're viewing as a Recruiter. Switch to Job Seeker view to apply to
          jobs.
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Desktop Filters Sidebar */}
        {!isMobile && (
          <Box sx={{ width: 350, flexShrink: 0 }}>
            <FiltersComponent />
          </Box>
        )}

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <JobList
            filters={memoizedFilters}
            onJobApply={handleJobApply}
            onJobViewDetails={handleJobViewDetails}
          />
        </Box>
      </Box>

      {/* Mobile Filters */}
      {isMobile && (
        <>
          {/* Mobile Filter Button */}
          <Fab
            color="primary"
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={() => setMobileFiltersOpen(true)}
          >
            <FilterList />
          </Fab>

          {/* Mobile Filter Drawer */}
          <Drawer
            anchor="right"
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            sx={{
              "& .MuiDrawer-paper": {
                width: "100%",
                maxWidth: 400,
                p: 0,
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setMobileFiltersOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <Box sx={{ px: 2, pb: 2 }}>
              <FiltersComponent />
            </Box>
          </Drawer>
        </>
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
