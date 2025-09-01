import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import YouglishWidget from "../widgets/YouglishWidget.js";

export default function YouglishPanel({ open, onClose, word, lang = "english", width = 640, height = 550 }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [status, setStatus] = useState("初始化中...");

  // 初始化 Widget
  useEffect(() => {
    if (!containerRef.current || widgetRef.current) return;

    widgetRef.current = new YouglishWidget({
      containerId: containerRef.current.id,
      width,
      height,
      onStatus: (msg) => setStatus(msg),
    });

    widgetRef.current.init();

    return () => {
      widgetRef.current?.pause();
      widgetRef.current = null;
    };
  }, [containerRef]);

  // 当弹窗打开或单词改变时搜索
  useEffect(() => {
    if (open && widgetRef.current && word) {
      setStatus("搜索中: " + word);
      widgetRef.current.search(word, lang);
    }
  }, [open, word, lang]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        🎵 单词发音: {word}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          id="youglish-widget-container"
          ref={containerRef}
          sx={{
            width,
            height,
            border: "1px solid #ccc",
            borderRadius: 1,
            overflow: "hidden",
            mb: 1,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {status}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
