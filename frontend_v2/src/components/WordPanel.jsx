import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WordWidget from "./WordWidget";

export default function WordPanel({ open, word, lang = "en", nativeLang = "zh", onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { p: 1 } }}
    >
      {/* 标题栏 */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography >{word || "word"}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* 内容区域 */}
      <DialogContent dividers sx={{ p: 1 }}>
        {word ? (
          <WordWidget word={word} lang={lang} nativeLang={nativeLang} />
        ) : (
          <Typography>Opps!... something wrong</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
