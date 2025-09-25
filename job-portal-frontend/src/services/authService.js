import api from "./api";

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await api.post("/auth/register", userData);
      const { token, user } = response.data;

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  // Get user token
  getToken() {
    return localStorage.getItem("token");
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get("/profile/me");
      return response.data.profile;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get profile" };
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put("/profile/me", profileData);
      const updatedUser = response.data.profile;

      // Update user in localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update profile" };
    }
  },
};
