import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { jobsService } from "../../services/jobsService";

const JobForm = ({ open, onClose, onSuccess, job = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    location: "",
    salary: "",
    jobType: "FullTime",
    experienceLevel: "MidLevel",
    description: "",
    requiredSkills: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (isEdit && job) {
      setFormData({
        title: job.title || "",
        companyName: job.companyName || "",
        location: job.location || "",
        salary: job.salary || "",
        jobType: job.jobType || "FullTime",
        experienceLevel: job.experienceLevel || "MidLevel",
        description: job.description || "",
        requiredSkills: job.requiredSkills || [],
      });
    } else {
      // Reset form for new job
      setFormData({
        title: "",
        companyName: "",
        location: "",
        salary: "",
        jobType: "FullTime",
        experienceLevel: "MidLevel",
        description: "",
        requiredSkills: [],
      });
    }
    setError("");
  }, [isEdit, job, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      const requiredFields = {
        title: "Job Title",
        description: "Job Description",
        companyName: "Company Name",
        location: "Location",
        salary: "Salary",
      };

      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field] || formData[field].toString().trim() === "") {
          missingFields.push(label);
        }
      }

      // Check if required skills are provided
      if (!formData.requiredSkills || formData.requiredSkills.length === 0) {
        missingFields.push("Required Skills");
      }

      if (missingFields.length > 0) {
        setError(
          `Please fill in the following required fields: ${missingFields.join(
            ", "
          )}`
        );
        setLoading(false);
        return;
      }

      // Validate salary is a positive number
      const salaryValue = parseFloat(formData.salary);
      if (isNaN(salaryValue) || salaryValue <= 0) {
        setError("Please enter a valid salary amount greater than 0");
        setLoading(false);
        return;
      }

      // Convert salary to number if provided
      const submitData = {
        ...formData,
        salary: salaryValue,
      };

      // Debug logging
      console.log("Submitting job data:", submitData);

      if (isEdit && job) {
        await jobsService.updateJob(job.id, submitData);
      } else {
        await jobsService.createJob(submitData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Job submission error:", err);
      setError(err.message || "Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? "Edit Job" : "Create New Job"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="job-title"
                name="title"
                label="Job Title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="company-name"
                name="companyName"
                label="Company Name"
                value={formData.companyName}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="job-location-form"
                name="location"
                label="Location"
                value={formData.location}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="job-salary"
                name="salary"
                label="Salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
                InputProps={{
                  startAdornment: <Typography>$</Typography>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="job-type-form-label">Job Type</InputLabel>
                <Select
                  id="job-type-form-select"
                  labelId="job-type-form-label"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  label="Job Type"
                >
                  <MenuItem value="FullTime">Full Time</MenuItem>
                  <MenuItem value="PartTime">Part Time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Internship">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="experience-level-form-label">
                  Experience Level
                </InputLabel>
                <Select
                  id="experience-level-form-select"
                  labelId="experience-level-form-label"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  label="Experience Level"
                >
                  <MenuItem value="EntryLevel">Entry Level</MenuItem>
                  <MenuItem value="MidLevel">Mid Level</MenuItem>
                  <MenuItem value="SeniorLevel">Senior Level</MenuItem>
                  <MenuItem value="Executive">Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="job-description"
                name="description"
                label="Job Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={4}
                disabled={loading}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="required-skills"
                name="requiredSkills"
                label="Required Skills (comma-separated)"
                value={
                  Array.isArray(formData.requiredSkills)
                    ? formData.requiredSkills.join(", ")
                    : formData.requiredSkills
                }
                onChange={(e) => {
                  const skills = e.target.value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter((skill) => skill);
                  setFormData((prev) => ({ ...prev, requiredSkills: skills }));
                }}
                fullWidth
                required
                multiline
                rows={2}
                disabled={loading}
                placeholder="JavaScript, React, Node.js, SQL..."
                helperText="Enter skills separated by commas"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
              ? "Update Job"
              : "Create Job"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default JobForm;
