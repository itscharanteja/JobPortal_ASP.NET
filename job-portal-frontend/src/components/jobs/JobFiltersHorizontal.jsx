import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Grid,
} from "@mui/material";
import { Search, FilterList, Clear } from "@mui/icons-material";

const JobFiltersHorizontal = ({
  onFilterChange,
  initialFilters = {},
  onSortChange,
}) => {
  const [filters, setFilters] = useState(() => ({
    searchQuery: "",
    location: "",
    jobType: "",
    experienceLevel: "",
    isRemote: false,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  }));

  // Options for dropdowns
  const jobTypes = [
    { value: "FullTime", label: "Full-time" },
    { value: "PartTime", label: "Part-time" },
    { value: "Contract", label: "Contract" },
    { value: "Internship", label: "Internship" },
  ];

  const experienceLevels = [
    { value: "EntryLevel", label: "Entry Level" },
    { value: "MidLevel", label: "Mid Level" },
    { value: "SeniorLevel", label: "Senior Level" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      const { sortBy, sortOrder, ...filterData } = filters;
      onFilterChange(filterData);
      if (onSortChange) {
        onSortChange(sortBy, sortOrder);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange, onSortChange]);

  const handleInputChange = useCallback((field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      searchQuery: "",
      location: "",
      jobType: "",
      experienceLevel: "",
      isRemote: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setFilters(clearedFilters);

    // Immediately trigger the change without waiting for debounce
    const { sortBy, sortOrder, ...filterData } = clearedFilters;
    onFilterChange(filterData);
    if (onSortChange) {
      onSortChange(sortBy, sortOrder);
    }
  }, [onFilterChange, onSortChange]);

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterList />
          <Typography variant="h6">Filters & Sort</Typography>
        </Box>
        <Button
          startIcon={<Clear />}
          onClick={clearAllFilters}
          size="small"
          color="secondary"
        >
          Clear All
        </Button>
      </Box>

      {/* Search Bar - Full Width */}
      <TextField
        id="job-search-query"
        name="searchQuery"
        fullWidth
        placeholder="Search jobs, companies, or keywords..."
        value={filters.searchQuery}
        onChange={(e) => handleInputChange("searchQuery", e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: "action.active" }} />,
        }}
        sx={{ mb: 2 }}
      />

      {/* Horizontal Filters Row */}
      <Grid container spacing={2} alignItems="center">
        {/* Location */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            id="job-location"
            name="location"
            label="Location"
            placeholder="City or Remote"
            fullWidth
            size="small"
            value={filters.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />
        </Grid>

        {/* Job Type */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="job-type-label">Job Type</InputLabel>
            <Select
              id="job-type-select"
              labelId="job-type-label"
              value={filters.jobType}
              label="Job Type"
              onChange={(e) => handleInputChange("jobType", e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {jobTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Experience Level */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="experience-level-label">Experience</InputLabel>
            <Select
              id="experience-level-select"
              labelId="experience-level-label"
              value={filters.experienceLevel}
              label="Experience"
              onChange={(e) =>
                handleInputChange("experienceLevel", e.target.value)
              }
            >
              <MenuItem value="">All Levels</MenuItem>
              {experienceLevels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Remote Work Toggle */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControlLabel
            control={
              <Switch
                id="remote-work-toggle"
                checked={filters.isRemote}
                onChange={(e) =>
                  handleInputChange("isRemote", e.target.checked)
                }
                name="isRemote"
                inputProps={{ 'aria-label': 'Remote work only filter' }}
              />
            }
            label="Remote Only"
          />
        </Grid>

        {/* Sort By */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              id="sort-select"
              labelId="sort-label"
              value={`${filters.sortBy}_${filters.sortOrder}`}
              label="Sort By"
              onChange={(e) => {
                const [field, order] = e.target.value.split("_");
                handleInputChange("sortBy", field);
                handleInputChange("sortOrder", order);
              }}
            >
              <MenuItem value="createdAt_desc">Newest First</MenuItem>
              <MenuItem value="createdAt_asc">Oldest First</MenuItem>
              <MenuItem value="title_asc">Title A-Z</MenuItem>
              <MenuItem value="title_desc">Title Z-A</MenuItem>
              <MenuItem value="companyName_asc">Company A-Z</MenuItem>
              <MenuItem value="companyName_desc">Company Z-A</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default JobFiltersHorizontal;
