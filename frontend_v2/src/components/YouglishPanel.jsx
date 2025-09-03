import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import YouglishWidget from "./YouglishWidget";

export default function YouglishPanel({ open, onClose, word, lang = "english", width = 640, height = 550 }) {
  const [status, setStatus] = useState("初始化中...");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        🎵 单词发音: {word}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
        {status}
      </Typography>

      <DialogContent>
        {/* ⚠️ 使用 display 控制显示，而不是条件渲染 */}
        <Box sx={{ display: open ? "block" : "none" }}>
          <YouglishWidget
            word={word}
            lang={lang}
            width={width}
            height={height}
            onStatus={(msg) => {
              console.log("YouglishWidget status:", msg);
              setStatus(msg);
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
