import React from "react";
import { Grid, Box, useMediaQuery, useTheme } from "@mui/material";
import LearnCard from "../components/LearnCard";

const apps = [
  { href: "/#wordcard", icon: "🎴", title: "Word Cards", description: "Review your vocabulary" },
  { href: "/#AIDict", icon: "🤖", title: "AI Dictionary", description: "Get AI-powered definitions" },
  { href: "/#conversation", icon: "🗣️", title: "Conversation", description: "Practice speaking with AI" },
];

export default function LearnPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // 手机端

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 56px)", // 56px 假设是底部导航高度
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      {isMobile ? (
        // 手机端: flex 列表
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            alignItems: "center",
          }}
        >
          {apps.map(app => (
            <Box sx={{ width: "100%", maxWidth: 360 }} key={app.title}>
              <LearnCard app={app} />
            </Box>
          ))}
        </Box>
      ) : (
        // PC端: 网格布局
        <Grid
          container
          spacing={2}
          justifyContent="center"
          alignItems="center" // 垂直居中
        >
          {apps.map(app => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={app.title}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Box sx={{ width: "100%", maxWidth: 300 }}>
                <LearnCard app={app} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
