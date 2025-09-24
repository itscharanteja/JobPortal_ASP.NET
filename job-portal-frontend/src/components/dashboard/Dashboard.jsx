import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { dashboardService } from "../../services/dashboardService";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
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

  const renderJobSeekerStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Applications
            </Typography>
            <Typography variant="h4">{stats?.totalJobsApplied || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Under Review
            </Typography>
            <Typography variant="h4">{stats?.jobsUnderReview || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Shortlisted
            </Typography>
            <Typography variant="h4">{stats?.jobsShortlisted || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Rejected
            </Typography>
            <Typography variant="h4">{stats?.jobsRejected || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRecruiterStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Jobs Posted
            </Typography>
            <Typography variant="h4">{stats?.totalJobsPosted || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Jobs
            </Typography>
            <Typography variant="h4">{stats?.totalActiveJobs || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAdminStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Jobs Posted
            </Typography>
            <Typography variant="h4">{stats?.totalJobsPosted || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Jobs
            </Typography>
            <Typography variant="h4">{stats?.totalActiveJobs || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Applications
            </Typography>
            <Typography variant="h4">{stats?.totalJobsApplied || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Under Review
            </Typography>
            <Typography variant="h4">{stats?.jobsUnderReview || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRecentActivities = () => (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activities
      </Typography>
      {stats?.recentActivities?.length > 0 ? (
        <List>
          {stats.recentActivities.map((activity, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={activity.description}
                secondary={`${activity.jobTitle} at ${
                  activity.companyName
                } - ${new Date(activity.timestamp).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="textSecondary">No recent activities</Typography>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - Welcome {user?.firstName || user?.email}!
      </Typography>

      <Box mt={3}>
        {user?.roles?.includes("JobSeeker") && renderJobSeekerStats()}
        {user?.roles?.includes("Recruiter") && renderRecruiterStats()}
        {user?.roles?.includes("Admin") && renderAdminStats()}
      </Box>

      {renderRecentActivities()}
    </Container>
  );
};

export default Dashboard;
