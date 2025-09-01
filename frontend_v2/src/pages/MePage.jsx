import React from "react";
import { Box, Typography, Avatar, IconButton, Paper } from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import Calendar from "../components/LearningCalendar";
import { useNavigate } from "react-router-dom";

export default function MePage() {
  const navigate = useNavigate(); // 用路由导航替代 PageContext

  const userinfo = { username: "JohnDoe" };

  const stats = [
    { label: "You have been learning for:", value: "123 days", gradient: "linear-gradient(45deg, #ffd700, #ffed4e)" },
    { label: "You have added words:", value: "456", gradient: "linear-gradient(45deg, #ffd700, #ffed4e)" },
  ];

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {stats.map(stat => (
        <Paper key={stat.label} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
          <Typography variant="h5" sx={{ background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stat.value}
          </Typography>
        </Paper>
      ))}

      <Paper sx={{ p: 2, width: '100%', overflowX: 'auto' }}>
        <Typography variant="subtitle2" gutterBottom>Learning Calendar</Typography>
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
          <Calendar
            year={new Date().getFullYear()}
            month={new Date().getMonth() + 1}
            learnedDays={[1, 2, 3, 5, 10]}
            sx={{ width: '100%' }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src="/static/imgs/default-avatar.png" />
          <Typography variant="h6" noWrap>{userinfo.username || 'Guest'}</Typography>
        </Box>
        <IconButton onClick={() => navigate('/settings')} color="inherit">
          <SettingsIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}
