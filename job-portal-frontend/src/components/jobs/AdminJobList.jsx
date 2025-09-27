import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Delete,
  People,
  Work,
  LocationOn,
  AttachMoney,
  Add,
} from "@mui/icons-material";
import { adminService } from "../../services/adminService";
import { jobsService } from "../../services/jobsService";
import JobApplicants from "./JobApplicants";
import JobForm from "./JobForm";
import ConfirmDialog from "../common/ConfirmDialog";

const AdminJobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);

  // Job form states
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success message state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    fetchAdminJobs();
  }, []);

  const fetchAdminJobs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdminJobs();
      setJobs(data);
    } catch (err) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplicants = (jobId) => {
    setSelectedJobId(jobId);
    setApplicantsDialogOpen(true);
  };

  const handleCloseApplicantsDialog = () => {
    setApplicantsDialogOpen(false);
    setSelectedJobId(null);
    // Refresh jobs list to update application counts if status changed
    fetchAdminJobs();
  };

  // Job CRUD operations
  const handleCreateJob = () => {
    setEditingJob(null);
    setIsEditMode(false);
    setJobFormOpen(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setIsEditMode(true);
    setJobFormOpen(true);
  };

  const handleCloseJobForm = () => {
    setJobFormOpen(false);
    setEditingJob(null);
    setIsEditMode(false);
  };

  const handleJobFormSuccess = () => {
    fetchAdminJobs(); // Refresh the job list
    setSnackbarMessage(
      isEditMode ? "Job updated successfully!" : "Job created successfully!"
    );
    setSnackbarOpen(true);
  };

  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    setDeleteLoading(true);
    try {
      await jobsService.deleteJob(jobToDelete.id);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
      fetchAdminJobs(); // Refresh the job list
      setSnackbarMessage("Job deleted successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      setError(err.message || "Failed to delete job");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "success";
      case "closed":
        return "error";
      case "draft":
        return "warning";
      default:
        return "default";
    }
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType?.toLowerCase()) {
      case "fulltime":
        return "primary";
      case "parttime":
        return "secondary";
      case "contract":
        return "info";
      case "internship":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (jobs.length === 0) {
    return (
      <>
        {/* Header with Create Job button */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h5" component="h2">
            My Posted Jobs (0)
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateJob}
          >
            Create New Job
          </Button>
        </Box>

        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No jobs posted yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Create your first job posting to start receiving applications
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleCreateJob}
            sx={{ mt: 2 }}
          >
            Create Your First Job
          </Button>
        </Box>

        {/* Job Form Dialog */}
        <JobForm
          open={jobFormOpen}
          onClose={handleCloseJobForm}
          onSuccess={handleJobFormSuccess}
          job={editingJob}
          isEdit={isEditMode}
        />

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />
      </>
    );
  }

  return (
    <>
      {/* Header with Create Job button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          My Posted Jobs ({jobs.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateJob}
        >
          Create New Job
        </Button>
      </Box>

      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} key={job.id}>
            <Card elevation={2} sx={{ "&:hover": { elevation: 4 } }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Box flex={1}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      <Work
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      {job.companyName}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={job.status || "Open"}
                      color={getStatusColor(job.status)}
                      size="small"
                    />
                    <Chip
                      label={job.jobType || "Full Time"}
                      color={getJobTypeColor(job.jobType)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    <LocationOn
                      fontSize="small"
                      sx={{ mr: 0.5, verticalAlign: "middle" }}
                    />
                    {job.location}
                  </Typography>
                  {job.salary && (
                    <Typography variant="body2" color="text.secondary">
                      <AttachMoney
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      ${job.salary.toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <People
                      fontSize="small"
                      sx={{ mr: 0.5, verticalAlign: "middle" }}
                    />
                    {job.applicationCount} Application
                    {job.applicationCount !== 1 ? "s" : ""}
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    Posted: {new Date(job.createdAt).toLocaleDateString()}
                    {job.updatedAt && job.updatedAt !== job.createdAt && (
                      <>
                        {" "}
                        • Updated:{" "}
                        {new Date(job.updatedAt).toLocaleDateString()}
                      </>
                    )}
                  </Typography>

                  <Box display="flex" gap={1}>
                    {job.applicationCount > 0 && (
                      <Tooltip title="View Applicants">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<People />}
                          onClick={() => handleViewApplicants(job.id)}
                        >
                          View Applicants ({job.applicationCount})
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip title="View Details">
                      <IconButton color="primary" size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Job">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleEditJob(job)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Job">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteJob(job)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Job Form Dialog */}
      <JobForm
        open={jobFormOpen}
        onClose={handleCloseJobForm}
        onSuccess={handleJobFormSuccess}
        job={editingJob}
        isEdit={isEditMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={confirmDeleteJob}
        title="Delete Job"
        message={
          jobToDelete
            ? `Are you sure you want to delete "${jobToDelete.title}"? This action cannot be undone and will remove all associated applications.`
            : "Are you sure you want to delete this job?"
        }
        confirmText="Delete Job"
        severity="error"
        loading={deleteLoading}
      />

      {/* Job Applicants Dialog */}
      <Dialog
        open={applicantsDialogOpen}
        onClose={handleCloseApplicantsDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Job Applicants</Typography>
              {selectedJobId && jobs.find(job => job.id === selectedJobId) && (
                <Typography variant="body2" color="text.secondary">
                  {jobs.find(job => job.id === selectedJobId).title}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJobId && <JobApplicants jobId={selectedJobId} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApplicantsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </>
  );
};

export default AdminJobList;
