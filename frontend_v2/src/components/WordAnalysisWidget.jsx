import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemText, Divider } from "@mui/material";
import { fetchWordAnalysis } from "../common/api_vocb.js";

export default function WordAnalysisWidget({ word, text, lang, nativeLang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!word) return;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchWordAnalysis({ word, text, lang, nativeLang });
        setData(result);
      } catch (err) {
        console.error("Failed to load word analysis:", err);
        setError(err.message || "Load failed");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [word, text, lang, nativeLang]);

  if (loading) {
    return <Typography>Loading analysis...</Typography>;
  }

  if (error) {
    return <Typography color="error">Load failed: {error}</Typography>;
  }

  if (!data) {
    return <Typography>No analysis available.</Typography>;
  }

  return (
    <Box>
      {/* Basic Info */}
      <Box mb={2}>
        <Typography variant="h6">Basic Info</Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Part of speech" secondary={data.part || "-"} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Meaning" secondary={data.meaning || "-"} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Level" secondary={data.level || "-"} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Feature" secondary={data.features || "-"} />
          </ListItem>
        </List>
      </Box>

      {/* Oral Replacement */}
      {data.oral_replacement?.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Oral Replacement</Typography>
          <List dense>
            {data.oral_replacement.map((item, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={`${item.word}: ${item.replaced}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Cases by Levels */}
      {data.cases_of_levels?.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Cases by Levels</Typography>
          <List dense>
            {data.cases_of_levels.map((item, idx) => (
              <ListItem key={idx} alignItems="flex-start">
                <ListItemText
                  primary={`Level ${item.level} - ${item.words}: ${item.replaced}`}
                  secondary={`Chinese: ${item.chinese}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
