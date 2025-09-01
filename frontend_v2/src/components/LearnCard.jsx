import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

export default function LearnCard({ app }) {
  return (
    <Card
      component="a"
      href={app.href}
      sx={{
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
        p: 2,
        mb: 2,
        "&:hover": { boxShadow: 6 },
      }}
    >
      <Box sx={{ fontSize: 32, mr: 2 }}>{app.icon}</Box>
      <CardContent sx={{ p: 0 }}>
        <Typography variant="h6">{app.title}</Typography>
        <Typography variant="body2" color="text.secondary">{app.description}</Typography>
      </CardContent>
    </Card>
  );
}
