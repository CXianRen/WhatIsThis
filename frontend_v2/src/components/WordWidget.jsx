import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, Chip, Divider } from "@mui/material";
import { fetchWordDetail } from "../common/api_vocb.js";

export default function WordWidget({ word, lang = "en", nativeLang = "zh" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!word) return;

    const loadData = async () => {
      setLoading(true);
      setError("");
      setData(null);
      try {
        const result = await fetchWordDetail({ word, lang, nativeLang });
        setData(result);
      } catch (err) {
        console.error("Failed to load word detail:", err);
        setError(err.message || "Load failed");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [word, lang, nativeLang]);

  if (!word) return <Typography>Select a word to view details.</Typography>;
  if (loading) return <Typography>Loading, might take some seconds...</Typography>;
  if (error) return <Typography color="error">Load fail: {error}</Typography>;
  if (!data) return <Typography>No data available.</Typography>;

  const srcKey = `explain_${nativeLang}`;
  const dstKey = `explain_${lang}`;

  return (
    <Box>
      {/* Word title & pronunciation */}
      <Box mb={2}>
        <Typography variant="h5">{data.word || word}</Typography>
        {data.pronunciation && (
          <Typography variant="body2" color="text.secondary">
            {data.pronunciation} {data.spelling_pronunciation ? `(${data.spelling_pronunciation})` : ""}
          </Typography>
        )}
      </Box>

      {/* Native explanation */}
      {data[srcKey]?.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Explanation ({nativeLang}):</Typography>
          <List dense>
            {data[srcKey].map((e, idx) => (
              <ListItem key={idx}>
                <Typography>{e}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Target explanation */}
      {data[dstKey]?.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Explanation ({lang}):</Typography>
          <List dense>
            {data[dstKey].map((e, idx) => (
              <ListItem key={idx}>
                <Typography>{e}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Example sentences */}
      {data.example_sentences?.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Examples:</Typography>
          {data.example_sentences.map((ex, idx) => (
            <Box key={idx} mb={1} sx={{ p: 1, borderRadius: 1, bgcolor: "#f9f9f9" }}>
              {ex.scenario && <Typography variant="caption">{ex.scenario}</Typography>}
              <Typography variant="body2">{ex[lang] || ""}</Typography>
              <Typography variant="body2" color="text.secondary">{ex[nativeLang] || ""}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Synonyms */}
      {data.synonyms?.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Synonyms:</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {data.synonyms.map((s, idx) => (
              <Chip key={idx} label={s} size="small" />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
