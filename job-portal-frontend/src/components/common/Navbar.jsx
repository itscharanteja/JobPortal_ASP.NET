import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Helper function to check if user is admin
  const isAdmin = (user) => {
    if (!user) return false;
    const roles = user.roles || user.Roles || [];
    return (
      roles.includes("Admin") || user.role === "Admin" || user.Role === "Admin"
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Job Portal
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2">
              Welcome, {user?.firstName || user?.email}
            </Typography>
            <Button color="inherit" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate("/jobs")}>
              Jobs
            </Button>
            {/* Admin-only navigation */}
            {isAdmin(user) && (
              <Button color="inherit" onClick={() => navigate("/jobseekers")}>
                Job Seekers
              </Button>
            )}
            <Button color="inherit" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button color="inherit" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate("/register")}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
