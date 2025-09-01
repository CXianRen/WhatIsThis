import React from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";

export default function BookFilter({ filters, onChange }) {
  const handleChange = (field) => (e) => {
    onChange({ ...filters, [field]: e.target.value });
  };

  const clearFilters = () => {
    onChange({ language: "", level: "" });
  };

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Language</InputLabel>
        <Select value={filters.language} onChange={handleChange("language")}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="EN">English</MenuItem>
          <MenuItem value="FR">Français</MenuItem>
          <MenuItem value="DE">Deutsch</MenuItem>
          <MenuItem value="ZH">中文</MenuItem>
          <MenuItem value="SV">Svenska</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Level</InputLabel>
        <Select value={filters.level} onChange={handleChange("level")}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="A1">A1</MenuItem>
          <MenuItem value="A2">A2</MenuItem>
          <MenuItem value="B1">B1</MenuItem>
          <MenuItem value="B2">B2</MenuItem>
          <MenuItem value="C1">C1</MenuItem>
          <MenuItem value="C2">C2</MenuItem>
        </Select>
      </FormControl>

      <Button variant="outlined" onClick={clearFilters} disabled={!filters.language && !filters.level}>
        Clear
      </Button>
    </Box>
  );
}
