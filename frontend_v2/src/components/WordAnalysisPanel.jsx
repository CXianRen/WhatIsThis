import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WordAnalysisWidget from "./WordAnalysisWidget";

export default function WordAnalysisPanel({ open, word, text, lang = "en", nativeLang = "zh", onClose }) {
  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { p: 1 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">{word || "单词分析"}</Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {word ? (
          <WordAnalysisWidget
            word={word}
            text={text}
            lang={lang}
            nativeLang={nativeLang}
          />
        ) : (
          <Typography>请选择单词进行分析</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
