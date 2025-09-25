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
} from "@mui/material";
import {
  Download,
  Email,
  Person,
  Description,
  Visibility,
  Close,
} from "@mui/icons-material";
import { adminService } from "../../services/adminService";

const JobApplicants = ({ jobId }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [coverLetterDialogOpen, setCoverLetterDialogOpen] = useState(false);

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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "underreview":
        return "warning";
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
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status || "Unknown";
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
                  <Chip
                    label={getStatusLabel(applicant.status)}
                    color={getStatusColor(applicant.status)}
                    size="small"
                  />
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
    </>
  );
};

export default JobApplicants;
