import React, { useState } from "react";
import { Card, CardContent, Typography, CardMedia, LinearProgress, Chip, Stack, Box } from "@mui/material";

export default function BookCard({ book, onClick }) {
  const [imgSrc, setImgSrc] = useState(book.cover?.trim() || "/assets/book-placeholder.svg");
  const progress = book.progress || 0;

  const handleError = () => {
    if (imgSrc !== "/assets/book-placeholder.svg") {
      setImgSrc("/assets/book-placeholder.svg");
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{ display: "flex", cursor: "pointer", width: "100%", minHeight: 160, position: "relative" }}
    >
      <CardMedia
        component="img"
        sx={{ width: 120, height: 160, objectFit: "cover" }}
        image={imgSrc}
        alt={book.title}
        onError={handleError}
      />

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" noWrap>{book.title}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {book.description || "暫無描述"}
          </Typography>
        </Box>

        {progress > 0 && (
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
        )}
      </CardContent>

      {/* tags 放在 Card 左下角 */}
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          left: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5
        }}
      >
        {book.languages?.map(l => (
          <Chip key={l.lang} label={l.lang.toUpperCase()} size="small" color="secondary" />
        ))}
        {book.languages?.flatMap(l => l.level || []).map((level, idx) => (
          <Chip key={idx} label={level} size="small" color="secondary" />
        ))}
      </Box>
    </Card>
  );
}
