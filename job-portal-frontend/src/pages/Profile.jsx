import React from "react";
import { Container, Typography, Box, Paper, Grid } from "@mui/material";
import { Person } from "@mui/icons-material";
import ResumeManager from "../components/profile/ResumeManager";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  // Debug: Log user data to see what we have
  console.log("User data in Profile:", user);

  const handleResumeStatusChange = (status) => {
    console.log("Resume status updated:", status);
    // This could trigger a refresh of user data or other actions
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
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Name:</strong> {user.firstName || user.FirstName || "N/A"}{" "}
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Debug - Full user object:</strong>{" "}
              {JSON.stringify(user, null, 2)}
            </Typography>
          </Paper>
        </Grid>

        {/* Resume Manager - Show for debugging */}
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Role check: user.role = "{user.role}", user.Role = "{user.Role}",
            user.roles = {JSON.stringify(user.roles)}, user.Roles ={" "}
            {JSON.stringify(user.Roles)}
          </Typography>
          <ResumeManager onResumeStatusChange={handleResumeStatusChange} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
