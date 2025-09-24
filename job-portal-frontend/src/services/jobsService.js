import api from "./api";

export const jobsService = {
  // Get all jobs with optional filters
  async getJobs(params = {}) {
    try {
      const response = await api.get("/jobs", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch jobs" };
    }
  },

  // Get job by ID
  async getJobById(id) {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch job details" };
    }
  },

  // Create new job (recruiter only)
  async createJob(jobData) {
    try {
      const response = await api.post("/jobs", jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create job" };
    }
  },

  // Update job (recruiter only)
  async updateJob(id, jobData) {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update job" };
    }
  },

  // Delete job (recruiter/admin only)
  async deleteJob(id) {
    try {
      await api.delete(`/jobs/${id}`);
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete job" };
    }
  },

  // Apply to a job
  async applyToJob(jobId, applicationData = {}) {
    try {
      const response = await api.post(
        `/jobseeker/${jobId}/apply`,
        applicationData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to apply to job" };
    }
  },

  // Get user's applied jobs
  async getAppliedJobs() {
    try {
      const response = await api.get("/jobseeker/my-applications");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch applied jobs" };
    }
  },

  // Get saved jobs
  async getSavedJobs() {
    try {
      const response = await api.get("/jobs/saved");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch saved jobs" };
    }
  },

  // Save a job (bookmark)
  async saveJob(jobId) {
    try {
      const response = await api.post(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to save job" };
    }
  },

  // Remove saved job
  async unsaveJob(jobId) {
    try {
      const response = await api.delete(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to unsave job" };
    }
  },

  // Resume management
  async getResumeStatus() {
    try {
      const response = await api.get("/jobseeker/resume");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get resume status" };
    }
  },

  async uploadResume(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/jobseeker/resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to upload resume" };
    }
  },

  async downloadResume() {
    try {
      const response = await api.get("/jobseeker/resume/download");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to download resume" };
    }
  },
};
