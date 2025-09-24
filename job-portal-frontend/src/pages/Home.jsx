import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Job Portal
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          color="text.secondary"
        >
          Find your dream job or discover the perfect candidate
        </Typography>
        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
