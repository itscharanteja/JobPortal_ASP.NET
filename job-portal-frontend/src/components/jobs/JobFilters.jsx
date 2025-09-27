import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Autocomplete,
  Divider,
} from "@mui/material";
import { Search, FilterList, ExpandMore, Clear } from "@mui/icons-material";

const JobFilters = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    searchQuery: "",
    location: "",
    jobType: "",
    salaryMin: 0,
    salaryMax: 200000,
    isRemote: false,
    experienceLevel: "",
    companySize: "",
    industry: "",
    skills: [],
    ...initialFilters,
  });

  const [salaryRange, setSalaryRange] = useState([
    filters.salaryMin,
    filters.salaryMax,
  ]);

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

  const companySizes = [
    "Startup (1-10)",
    "Small (11-50)",
    "Medium (51-200)",
    "Large (201-1000)",
    "Enterprise (1000+)",
  ];

  const commonSkills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "SQL",
    "AWS",
    "Docker",
    "Kubernetes",
    "Git",
    "HTML",
    "CSS",
    "TypeScript",
    "MongoDB",
    "PostgreSQL",
    "Redis",
    "GraphQL",
    "REST API",
    "Machine Learning",
    "Data Analysis",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleInputChange = useCallback((field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSalaryChange = useCallback((event, newValue) => {
    setSalaryRange(newValue);
    setFilters((prev) => ({
      ...prev,
      salaryMin: newValue[0],
      salaryMax: newValue[1],
    }));
  }, []);

  const handleSkillsChange = useCallback((event, newValue) => {
    // Ensure skills is always an array and filter out empty values
    const cleanSkills = Array.isArray(newValue)
      ? newValue.filter((skill) => skill && skill.trim() !== "")
      : [];

    setFilters((prev) => ({
      ...prev,
      skills: cleanSkills,
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      searchQuery: "",
      location: "",
      jobType: "",
      salaryMin: 0,
      salaryMax: 200000,
      isRemote: false,
      experienceLevel: "",
      companySize: "",
      industry: "",
      skills: [],
    };
    setFilters(clearedFilters);
    setSalaryRange([0, 200000]);
    // Immediately trigger filter change for better UX
    onFilterChange(clearedFilters);
  }, [onFilterChange]);

  const formatSalary = (value) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

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
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                id="remote-work-toggle-advanced"
                checked={filters.isRemote}
                onChange={(e) => handleInputChange("isRemote", e.target.checked)}
                name="isRemote"
                inputProps={{ 'aria-label': 'Remote work only filter' }}
              />
            }
            label="Remote Only"
          />
        </Grid>

        {/* Sort By - Adding it to filters */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              id="sort-select"
              labelId="sort-label"
              value={`${filters.sortBy || 'createdAt'}_${filters.sortOrder || 'desc'}`}
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

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Advanced Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Salary Range */}
            <Grid item xs={12}>
              <Typography gutterBottom>
                Salary Range: {formatSalary(salaryRange[0])} -{" "}
                {formatSalary(salaryRange[1])}
              </Typography>
              <Slider
                value={salaryRange}
                onChange={handleSalaryChange}
                valueLabelDisplay="auto"
                valueLabelFormat={formatSalary}
                min={0}
                max={300000}
                step={5000}
                aria-label="Salary range"
                marks={[
                  { value: 0, label: "$0" },
                  { value: 50000, label: "$50k" },
                  { value: 100000, label: "$100k" },
                  { value: 150000, label: "$150k" },
                  { value: 200000, label: "$200k+" },
                ]}
              />
            </Grid>

            {/* Company Size */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="company-size-label">Company Size</InputLabel>
                <Select
                  id="company-size-select"
                  labelId="company-size-label"
                  value={filters.companySize}
                  label="Company Size"
                  onChange={(e) =>
                    handleInputChange("companySize", e.target.value)
                  }
                >
                  <MenuItem value="">All Sizes</MenuItem>
                  {companySizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Remote Work Toggle */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    id="remote-work-toggle-accordion"
                    checked={filters.isRemote}
                    onChange={(e) =>
                      handleInputChange("isRemote", e.target.checked)
                    }
                    name="isRemoteAdvanced"
                    inputProps={{ 'aria-label': 'Remote work only filter in advanced options' }}
                  />
                }
                label="Remote Work Only"
              />
            </Grid>

            {/* Skills */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={commonSkills}
                freeSolo
                value={filters.skills}
                onChange={handleSkillsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    id="job-skills"
                    name="skills"
                    label="Skills"
                    placeholder="Add skills..."
                    helperText="Type and press Enter to add custom skills"
                  />
                )}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Active Filters Display */}
      {(filters.searchQuery ||
        filters.location ||
        filters.jobType ||
        filters.experienceLevel ||
        filters.industry ||
        filters.isRemote ||
        filters.skills.length > 0) && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Active Filters:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {filters.searchQuery && (
              <Chip
                label={`Search: ${filters.searchQuery}`}
                onDelete={() => handleInputChange("searchQuery", "")}
                size="small"
              />
            )}
            {filters.location && (
              <Chip
                label={`Location: ${filters.location}`}
                onDelete={() => handleInputChange("location", "")}
                size="small"
              />
            )}
            {filters.jobType && (
              <Chip
                label={`Type: ${filters.jobType}`}
                onDelete={() => handleInputChange("jobType", "")}
                size="small"
              />
            )}
            {filters.experienceLevel && (
              <Chip
                label={`Experience: ${filters.experienceLevel}`}
                onDelete={() => handleInputChange("experienceLevel", "")}
                size="small"
              />
            )}
            {filters.industry && (
              <Chip
                label={`Industry: ${filters.industry}`}
                onDelete={() => handleInputChange("industry", "")}
                size="small"
              />
            )}
            {filters.isRemote && (
              <Chip
                label="Remote Only"
                onDelete={() => handleInputChange("isRemote", false)}
                size="small"
              />
            )}
            {filters.skills.map((skill, index) => (
              <Chip
                key={index}
                label={`Skill: ${skill}`}
                onDelete={() => {
                  const newSkills = filters.skills.filter(
                    (_, i) => i !== index
                  );
                  handleInputChange("skills", newSkills);
                }}
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default JobFilters;
