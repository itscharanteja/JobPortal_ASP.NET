import api from "./api";

export const dashboardService = {
  // Get dashboard statistics based on user role
  async getDashboardStats() {
    try {
      const response = await api.get("/dashboard");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch dashboard stats" }
      );
    }
  },
};
