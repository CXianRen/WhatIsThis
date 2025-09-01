// src/components/Calendar.jsx
import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

export default function Calendar({ year, month, learnedDays = [] }) {
  const date = new Date(year, month - 1, 1);
  const firstDay = date.getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const today = new Date();
  const currentDay = today.getFullYear() === year && today.getMonth() === month - 1 ? today.getDate() : -1;

  let weeks = [];
  let dayCounter = 1 - firstDay;
  while (dayCounter <= lastDate) {
    let week = [];
    for (let i = 0; i < 7; i++) {
      if (dayCounter < 1 || dayCounter > lastDate) {
        week.push(null);
      } else {
        week.push(dayCounter);
      }
      dayCounter++;
    }
    weeks.push(week);
  }

  const getDayColor = (day) => {
    if (!day) return "transparent";
    if (day === currentDay) return "#ffd700";
    if (learnedDays.includes(day)) return "#7cff90";
    return "rgba(255,255,255,0.15)";
  };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <TableCell key={d} align="center">{d}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {weeks.map((week, i) => (
            <TableRow key={i}>
              {week.map((day, j) => (
                <TableCell key={j} align="center" sx={{
                  bgcolor: getDayColor(day),
                  borderRadius: day === currentDay ? '4px' : 0,
                  width: 32,
                  height: 32
                }}>
                  {day || ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
