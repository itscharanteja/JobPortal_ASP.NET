import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  Download,
  Description,
  CheckCircle,
  Warning,
  Close,
} from "@mui/icons-material";
import { jobsService } from "../../services/jobsService";
import { useAuth } from "../../hooks/useAuth";

const ResumeManager = ({ onResumeStatusChange }) => {
  const { refreshResumeStatus } = useAuth();
  const [resumeStatus, setResumeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchResumeStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResumeStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await jobsService.getResumeStatus();
      setResumeStatus(status);
      onResumeStatusChange?.(status);
    } catch (err) {
      console.error("Error fetching resume status:", err);
      setError("Failed to load resume status");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF and Word documents are allowed");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      await jobsService.uploadResume(selectedFile);
      setSuccess("Resume uploaded successfully!");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      await fetchResumeStatus(); // Refresh local status
      await refreshResumeStatus(); // Refresh global status
    } catch (err) {
      console.error("Error uploading resume:", err);
      setError(err.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setError(null);
      const result = await jobsService.downloadResume();

      if (result.downloadUrl) {
        // Create a temporary link element to trigger download
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = result.fileName || "resume";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError("Download URL not available");
      }
    } catch (err) {
      console.error("Error downloading resume:", err);
      setError(err.message || "Failed to download resume");
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <Description />;
    const extension = fileName.split(".").pop()?.toLowerCase();
    return <Description color={extension === "pdf" ? "error" : "primary"} />;
  };

  const getFileTypeChip = (fileName) => {
    if (!fileName) return null;
    const extension = fileName.split(".").pop()?.toUpperCase();
    return (
      <Chip
        size="small"
        label={extension}
        color={extension === "PDF" ? "error" : "primary"}
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <CircularProgress size={24} />
          <Typography>Loading resume status...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        display="flex"
        alignItems="center"
        gap={1}
      >
        <Description />
        Resume Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {resumeStatus?.hasResume ? (
        <Box>
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
            Resume uploaded and ready for job applications
          </Alert>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {getFileIcon(resumeStatus.resumeFileName)}
            <Box flexGrow={1}>
              <Typography variant="body1" fontWeight="medium">
                {resumeStatus.resumeFileName
                  ? `Resume: ${resumeStatus.resumeFileName}`
                  : "Resume file uploaded"}
              </Typography>
              <Box display="flex" gap={1} mt={0.5}>
                {getFileTypeChip(resumeStatus.resumeFileName)}
                <Chip size="small" label="Active" color="success" />
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Replace Resume
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            No resume uploaded. You need to upload a resume before applying to
            jobs.
          </Alert>

          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Upload Resume
          </Button>
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">
            {resumeStatus?.hasResume ? "Replace Resume" : "Upload Resume"}
          </Typography>
          <IconButton onClick={() => setUploadDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box textAlign="center" py={2}>
            <input
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              id="resume-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="resume-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                size="large"
                sx={{ mb: 2 }}
              >
                Choose File
              </Button>
            </label>

            {selectedFile && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Selected file:
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                >
                  {getFileIcon(selectedFile.name)}
                  <Typography variant="body1">{selectedFile.name}</Typography>
                  {getFileTypeChip(selectedFile.name)}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}

            <Typography
              variant="caption"
              display="block"
              mt={2}
              color="text.secondary"
            >
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </Typography>
          </Box>

          {uploading && (
            <Box mt={2}>
              <LinearProgress />
              <Typography variant="body2" textAlign="center" mt={1}>
                Uploading resume...
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ResumeManager;
