import api from "./api";

export const adminService = {
  // Get all job seekers (admin only)
  async getJobSeekers() {
    try {
      const response = await api.get("/admin/jobseekers");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch job seekers" };
    }
  },

  // Download job seeker's resume (admin only)
  async downloadJobSeekerResume(userId) {
    try {
      const response = await api.get(
        `/admin/jobseekers/${userId}/resume/download`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to download resume" };
    }
  },

  // Get applicants for a specific job (admin only)
  async getJobApplicants(jobId) {
    try {
      const response = await api.get(`/admin/jobs/${jobId}/applicants`);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch job applicants" }
      );
    }
  },

  // Get admin's posted jobs
  async getAdminJobs() {
    try {
      const response = await api.get("/admin/jobs");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch admin jobs" };
    }
  },

  // Update applicant status (admin only)
  async updateApplicantStatus(applicationId, status, notes = "") {
    try {
      const response = await api.patch(`/admin/jobs/applications/${applicationId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update applicant status" };
    }
  },

  // Get application details (admin only)
  async getApplicationDetails(applicationId) {
    try {
      const response = await api.get(`/admin/jobs/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch application details" };
    }
  },
};
