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
        <Typography variant="h6">{word || "单词"}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* 内容区域 */}
      <DialogContent dividers>
        {word ? (
          <WordWidget word={word} lang={lang} nativeLang={nativeLang} />
        ) : (
          <Typography>请选择单词查看详情</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
