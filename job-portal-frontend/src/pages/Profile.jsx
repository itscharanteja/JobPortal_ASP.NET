import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Alert,
} from "@mui/material";
import { Person, Edit } from "@mui/icons-material";
import ResumeManager from "../components/profile/ResumeManager";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Debug: Log user data to see what we have
  //   console.log("User data in Profile:", user);

  const handleResumeStatusChange = (status) => {
    console.log("Resume status updated:", status);
    // This could trigger a refresh of user data or other actions
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSuccessMessage("");
  };

  const handleSaveProfile = async (profileData) => {
    setLoading(true);
    try {
      await updateProfile(profileData);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSuccessMessage("");
  };

  // Helper function to check if user is admin
  const isAdmin = (user) => {
    if (!user) return false;
    const roles = user.roles || user.Roles || [];
    return (
      roles.includes("Admin") || user.role === "Admin" || user.Role === "Admin"
    );
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" color="error">
          Please log in to view your profile.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
          My Profile
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your profile and resume
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* User Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {!isEditing ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Personal Information</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEditClick}
                    size="small"
                  >
                    Edit Profile
                  </Button>
                </Box>

                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong>{" "}
                  {user.firstName || user.FirstName || "N/A"}{" "}
                  {user.lastName || user.LastName || ""}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {user.email || user.Email || "N/A"}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Role:</strong>{" "}
                  {user.role ||
                    user.Role ||
                    (user.roles && user.roles[0]) ||
                    (user.Roles && user.Roles[0]) ||
                    "N/A"}
                </Typography>
              </>
            ) : (
              <ProfileEditForm
                user={user}
                onSave={handleSaveProfile}
                onCancel={handleCancelEdit}
                loading={loading}
              />
            )}
          </Paper>
        </Grid>

        {/* Resume Manager - Only show for Job Seekers */}
        {!isAdmin(user) && (
          <Grid item xs={12}>
            <ResumeManager onResumeStatusChange={handleResumeStatusChange} />
          </Grid>
        )}

        {/* Admin-only message */}
        {isAdmin(user) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Admin Profile
              </Typography>
              <Typography variant="body1" color="text.secondary">
                As an administrator, you have access to manage job postings and
                view job seeker applications. Use the navigation to access job
                management and applicant features.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Profile;
