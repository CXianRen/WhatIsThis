import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getTagList, getWordTags, addTag, addTagToWord } from "../common/api_vocb.js";

export default function TagPanel({ open, word, onClose }) {
  const [allowTags, setAllowTags] = useState([]);
  const [wordTags, setWordTags] = useState([]);
  const [tempTags, setTempTags] = useState([]);
  const [inputValue, setInputValue] = useState("");

  // 初始化获取允许的标签
  useEffect(() => {
    if (!open) return;
    getTagList((tags) => {
      setAllowTags(tags);
    });
  }, [open]);

  // 每次显示面板获取单词已有标签
  useEffect(() => {
    if (!open || !word) return;
    getWordTags(word, (tags) => {
      setWordTags(tags);
      setTempTags(tags);
    });
  }, [open, word]);

  const toggleTag = (tag) => {
    setTempTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTags = () => {
    const newTags = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !allowTags.includes(t));

    if (newTags.length === 0) return;

    addTag(newTags, (tags) => {
      setAllowTags(tags);
      setInputValue("");
    });
  };

  const handleSave = () => {
    const unchanged =
      tempTags.length === wordTags.length &&
      tempTags.every((t) => wordTags.includes(t));

    if (unchanged) return;

    addTagToWord(word, tempTags, () => {
      alert("标签已保存！");
      onClose?.();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        添加标签: {word}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          可用标签:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {allowTags.map((tag) => (
            <Button
              key={tag}
              variant={tempTags.includes(tag) ? "contained" : "outlined"}
              size="small"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </Stack>

        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="输入标签，逗号分隔"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button variant="contained" onClick={handleAddNewTags}>
            新增
          </Button>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          已选标签:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {tempTags.map((tag) => (
            <Button
              key={tag}
              variant="contained"
              size="small"
              color="secondary"
              onClick={() => toggleTag(tag)}
            >
              {tag} ×
            </Button>
          ))}
        </Stack>

        <Button variant="contained" fullWidth onClick={handleSave}>
          保存
        </Button>
      </DialogContent>
    </Dialog>
  );
}
