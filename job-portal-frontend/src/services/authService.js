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
};
