import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Download, Person, Email, Description } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { adminService } from "../services/adminService";

const JobSeekers = () => {
  const { user } = useAuth();
  const [jobSeekers, setJobSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if user is admin
  const isAdmin = (user) => {
    if (!user) return false;
    const roles = user.roles || user.Roles || [];
    return (
      roles.includes("Admin") || user.role === "Admin" || user.Role === "Admin"
    );
  };

  useEffect(() => {
    if (isAdmin(user)) {
      fetchJobSeekers();
    } else {
      setError("Access denied. Admin privileges required.");
      setLoading(false);
    }
  }, [user]);

  const fetchJobSeekers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getJobSeekers();
      setJobSeekers(data);
    } catch (err) {
      setError(err.message || "Failed to load job seekers");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async (userId, userName) => {
    try {
      const downloadData = await adminService.downloadJobSeekerResume(userId);
      if (downloadData.downloadUrl) {
        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = downloadData.downloadUrl;
        link.download = downloadData.fileName || `${userName}_resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error downloading resume:", err);
      setError("Failed to download resume");
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!isAdmin(user)) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Access denied. This page is only available to administrators.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Person />
          Job Seekers Management
        </Typography>
        <Typography variant="h6" color="text.secondary">
          View and manage all registered job seekers and their resumes
        </Typography>
      </Box>

      {/* Job Seekers Table */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="job seekers table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Resume Status</TableCell>
                <TableCell align="center">Applications</TableCell>
                <TableCell align="center">Joined Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobSeekers.map((jobSeeker) => (
                <TableRow key={jobSeeker.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {jobSeeker.firstName} {jobSeeker.lastName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Email color="action" fontSize="small" />
                      {jobSeeker.email}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {jobSeeker.hasResume ? (
                      <Chip
                        label="Has Resume"
                        color="success"
                        size="small"
                        icon={<Description />}
                      />
                    ) : (
                      <Chip
                        label="No Resume"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={jobSeeker.applicationCount || 0}
                      color="info"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {new Date(
                      jobSeeker.createdAt || jobSeeker.joinedDate
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    {jobSeeker.hasResume && (
                      <Tooltip title="Download Resume">
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleDownloadResume(
                              jobSeeker.id,
                              `${jobSeeker.firstName}_${jobSeeker.lastName}`
                            )
                          }
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {jobSeekers.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No job seekers found
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default JobSeekers;
