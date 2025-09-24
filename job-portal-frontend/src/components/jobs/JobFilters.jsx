import React, { useState, useEffect } from "react";
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
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Freelance",
  ];

  const experienceLevels = [
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Executive Level",
  ];

  const companySizes = [
    "Startup (1-10)",
    "Small (11-50)",
    "Medium (51-200)",
    "Large (201-1000)",
    "Enterprise (1000+)",
  ];

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Retail",
    "Marketing",
    "Consulting",
    "Government",
    "Non-profit",
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

  const commonLocations = [
    "New York, NY",
    "San Francisco, CA",
    "Los Angeles, CA",
    "Chicago, IL",
    "Boston, MA",
    "Seattle, WA",
    "Austin, TX",
    "Denver, CO",
    "Atlanta, GA",
    "Miami, FL",
    "Remote",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 500); // Debounce filter changes

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // onFilterChange is intentionally omitted to prevent infinite loops

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSalaryChange = (event, newValue) => {
    setSalaryRange(newValue);
    setFilters((prev) => ({
      ...prev,
      salaryMin: newValue[0],
      salaryMax: newValue[1],
    }));
  };

  const handleSkillsChange = (event, newValue) => {
    setFilters((prev) => ({
      ...prev,
      skills: newValue,
    }));
  };

  const clearAllFilters = () => {
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
  };

  const formatSalary = (value) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterList />
          <Typography variant="h6">Filters</Typography>
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

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search jobs, companies, or keywords..."
        value={filters.searchQuery}
        onChange={(e) => handleInputChange("searchQuery", e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: "action.active" }} />,
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {/* Location */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            freeSolo
            options={commonLocations}
            value={filters.location}
            onChange={(event, newValue) =>
              handleInputChange("location", newValue || "")
            }
            onInputChange={(event, newInputValue) =>
              handleInputChange("location", newInputValue)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                placeholder="Enter city or 'Remote'"
                fullWidth
              />
            )}
          />
        </Grid>

        {/* Job Type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Job Type</InputLabel>
            <Select
              value={filters.jobType}
              label="Job Type"
              onChange={(e) => handleInputChange("jobType", e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {jobTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Experience Level */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Experience Level</InputLabel>
            <Select
              value={filters.experienceLevel}
              label="Experience Level"
              onChange={(e) =>
                handleInputChange("experienceLevel", e.target.value)
              }
            >
              <MenuItem value="">All Levels</MenuItem>
              {experienceLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Industry */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Industry</InputLabel>
            <Select
              value={filters.industry}
              label="Industry"
              onChange={(e) => handleInputChange("industry", e.target.value)}
            >
              <MenuItem value="">All Industries</MenuItem>
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Accordion sx={{ mt: 3 }}>
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
                <InputLabel>Company Size</InputLabel>
                <Select
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
                    checked={filters.isRemote}
                    onChange={(e) =>
                      handleInputChange("isRemote", e.target.checked)
                    }
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
