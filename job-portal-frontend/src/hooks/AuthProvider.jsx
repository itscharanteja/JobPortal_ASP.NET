import React, { useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import { jobsService } from "../services/jobsService";
import { AuthContext } from "../contexts/AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeStatus, setResumeStatus] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { user: userData } = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const { user: newUser } = await authService.register(userData);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await authService.updateProfile(profileData);
    setUser(updatedUser);
    return updatedUser;
  };

  const refreshResumeStatus = useCallback(async () => {
    const isJobSeeker =
      user?.roles?.includes("JobSeeker") ||
      user?.Roles?.includes("JobSeeker") ||
      user?.userType === "JobSeeker" ||
      user?.UserType === "JobSeeker";

    if (isJobSeeker) {
      try {
        const status = await jobsService.getResumeStatus();
        setResumeStatus(status);
      } catch (error) {
        console.error("Error fetching resume status:", error);
        setResumeStatus({ hasResume: false, resumeFileName: null });
      }
    }
  }, [user]);

  const updateResumeStatus = (status) => {
    setResumeStatus(status);
  };

  // Fetch resume status when user changes
  useEffect(() => {
    const isJobSeeker =
      user?.roles?.includes("JobSeeker") ||
      user?.Roles?.includes("JobSeeker") ||
      user?.userType === "JobSeeker" ||
      user?.UserType === "JobSeeker";

    if (isJobSeeker) {
      refreshResumeStatus();
    }
  }, [user, refreshResumeStatus]);

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    resumeStatus,
    refreshResumeStatus,
    updateResumeStatus,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
