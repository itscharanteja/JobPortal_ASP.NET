import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Snackbar,
} from "@mui/material";
import {
  Download,
  Email,
  Person,
  Description,
  Visibility,
  Close,
  Edit,
  Save,
  Cancel,
} from "@mui/icons-material";
import { adminService } from "../../services/adminService";

const JobApplicants = ({ jobId }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [coverLetterDialogOpen, setCoverLetterDialogOpen] = useState(false);
  
  // Status change states
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Available status options
  const statusOptions = [
    { value: "Submitted", label: "Submitted", color: "info" },
    { value: "UnderReview", label: "Under Review", color: "warning" },
    { value: "Shortlisted", label: "Shortlisted", color: "secondary" },
    { value: "InterviewScheduled", label: "Interview Scheduled", color: "primary" },
    { value: "Accepted", label: "Accepted", color: "success" },
    { value: "Rejected", label: "Rejected", color: "error" },
  ];

  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getJobApplicants(jobId);
      setApplicants(data);
    } catch (err) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchApplicants();
    }
  }, [jobId, fetchApplicants]);

  const handleDownloadResume = async (jobSeekerId, jobSeekerName) => {
    try {
      const downloadData = await adminService.downloadJobSeekerResume(
        jobSeekerId
      );
      if (downloadData.downloadUrl) {
        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = downloadData.downloadUrl;
        link.download = downloadData.fileName || `${jobSeekerName}_resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error downloading resume:", err);
      setError("Failed to download resume");
    }
  };

  const handleViewCoverLetter = (applicant) => {
    setSelectedApplicant(applicant);
    setCoverLetterDialogOpen(true);
  };

  const handleCloseCoverLetterDialog = () => {
    setCoverLetterDialogOpen(false);
    setSelectedApplicant(null);
  };

  // Status change handlers
  const handleChangeStatus = (applicant) => {
    setSelectedApplication(applicant);
    setNewStatus(applicant.status || "Submitted");
    setStatusNotes("");
    setStatusChangeDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusChangeDialogOpen(false);
    setSelectedApplication(null);
    setNewStatus("");
    setStatusNotes("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedApplication || !newStatus) return;

    setStatusUpdateLoading(true);
    try {
      await adminService.updateApplicantStatus(
        selectedApplication.applicationId,
        newStatus,
        statusNotes
      );

      // Update the local state
      setApplicants(prevApplicants =>
        prevApplicants.map(applicant =>
          applicant.applicationId === selectedApplication.applicationId
            ? { ...applicant, status: newStatus }
            : applicant
        )
      );

      setSnackbar({
        open: true,
        message: `Status updated to ${getStatusLabel(newStatus)} successfully!`,
        severity: "success"
      });

      handleCloseStatusDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update status",
        severity: "error"
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "underreview":
        return "warning";
      case "shortlisted":
        return "secondary";
      case "interviewscheduled":
        return "primary";
      case "submitted":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "underreview":
        return "Under Review";
      case "submitted":
        return "Submitted";
      case "shortlisted":
        return "Shortlisted";
      case "interviewscheduled":
        return "Interview Scheduled";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status || "Unknown";
    }
  };

  const getStatusCounts = () => {
    const counts = {};
    applicants.forEach(applicant => {
      const status = applicant.status || 'Submitted';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

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

  if (applicants.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6" color="text.secondary">
          No applications yet
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Applications will appear here when job seekers apply to this position
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Status Summary */}
      {applicants.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Application Summary ({applicants.length} total)
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {statusOptions.map(option => {
              const count = statusCounts[option.value] || 0;
              return (
                <Chip
                  key={option.value}
                  label={`${option.label}: ${count}`}
                  color={count > 0 ? option.color : "default"}
                  variant={count > 0 ? "filled" : "outlined"}
                  size="small"
                />
              );
            })}
          </Box>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="applicants table">
          <TableHead>
            <TableRow>
              <TableCell>Applicant</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Resume</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Applied Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applicants.map((applicant) => (
              <TableRow key={applicant.applicationId} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person color="primary" />
                    <Typography variant="body2" fontWeight="bold">
                      {applicant.jobSeekerName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Email color="action" fontSize="small" />
                    {applicant.jobSeekerEmail}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {applicant.hasResume ? (
                    <Chip
                      label="Available"
                      color="success"
                      size="small"
                      icon={<Description />}
                    />
                  ) : (
                    <Chip
                      label="None"
                      color="default"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <Chip
                      label={getStatusLabel(applicant.status)}
                      color={getStatusColor(applicant.status)}
                      size="small"
                    />
                    <Tooltip title="Change Status">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleChangeStatus(applicant)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {new Date(applicant.appliedDate).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={1} justifyContent="center">
                    {applicant.hasResume && (
                      <Tooltip title="Download Resume">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() =>
                            handleDownloadResume(
                              applicant.jobSeekerId,
                              applicant.jobSeekerName.replace(" ", "_")
                            )
                          }
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    )}
                    {applicant.coverLetter && (
                      <Tooltip title="View Cover Letter">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handleViewCoverLetter(applicant)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Cover Letter Dialog */}
      <Dialog
        open={coverLetterDialogOpen}
        onClose={handleCloseCoverLetterDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Cover Letter</Typography>
            <IconButton onClick={handleCloseCoverLetterDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedApplicant && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>From:</strong> {selectedApplicant.jobSeekerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Email:</strong> {selectedApplicant.jobSeekerEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Applied:</strong>{" "}
                {new Date(selectedApplicant.appliedDate).toLocaleDateString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
              >
                {selectedApplicant.coverLetter || "No cover letter provided"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCoverLetterDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusChangeDialogOpen}
        onClose={handleCloseStatusDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Application Status
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Applicant:</strong> {selectedApplication.jobSeekerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                <strong>Email:</strong> {selectedApplication.jobSeekerEmail}
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip
                        label={option.label}
                        color={option.color}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes (Optional)"
                placeholder="Add any notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                variant="outlined"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={statusUpdateLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={statusUpdateLoading || !newStatus}
            startIcon={statusUpdateLoading ? <CircularProgress size={20} /> : <Save />}
          >
            {statusUpdateLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for status updates */}
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
    </>
  );
};

export default JobApplicants;
