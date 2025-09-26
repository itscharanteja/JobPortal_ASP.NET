import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit, Save, Cancel } from "@mui/icons-material";

const ProfileEditForm = ({ user, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.FirstName || "",
    lastName: user?.lastName || user?.LastName || "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = "First name must be 50 characters or less";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = "Last name must be 50 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      setSubmitError(error.message || "Failed to update profile");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Edit />
        Edit Profile
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <TextField
        id="first-name"
        fullWidth
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        error={!!errors.firstName}
        helperText={errors.firstName}
        margin="normal"
        required
        disabled={loading}
        inputProps={{ maxLength: 50 }}
      />

      <TextField
        id="last-name"
        fullWidth
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        error={!!errors.lastName}
        helperText={errors.lastName}
        margin="normal"
        required
        disabled={loading}
        inputProps={{ maxLength: 50 }}
      />

      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outlined"
          startIcon={<Cancel />}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default ProfileEditForm;
