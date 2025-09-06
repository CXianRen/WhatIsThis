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
  Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getTagList, getWordTags, addTag, addTagToWord, removeTagFromWord } from "../common/api_vocb.js";

export default function TagPanel({ open, word, onClose }) {
  const [allowTags, setAllowTags] = useState([]);
  const [wordTags, setWordTags] = useState([]);
  const [inputValue, setInputValue] = useState("");

  // 初始化获取允许的标签
  useEffect(() => {
    if (!open) return;
    getTagList('en', (tags) => {
      console.log("Allowed tags:", tags);
      setAllowTags(tags);
    });
  }, [open]);

  // 每次显示面板获取单词已有标签
  useEffect(() => {
    if (!open || !word) return;
    getWordTags(word, 'en').then((tags) => {
      console.log("Word tags:", tags);
      setWordTags(tags);
    });
  }, [open, word]);

  const _addTagToWord = (word, tag) => {
    console.log("Adding tag to word:", word, tag);
    addTagToWord(word, tag).then((res) => {
      console.log("Added tag to word:", res);
      setWordTags([...wordTags, res]);
    }).catch((error) => {
      console.error("Failed to add tag to word:", error);
      alert("添加标签失败: " + error.message);
    });
  };

  const _removeTagFromWord = (word, tag) => {
    console.log("Removing tag from word:", word, tag);
    removeTagFromWord(word, tag).then((res) => {
      console.log("Removed tag from word:", res);
      setWordTags(wordTags.filter(t => t.id !== tag.id));
    }).catch((error) => {
      console.error("Failed to remove tag from word:", error);
      alert("移除标签失败: " + error.message);
    });
  }

  const tagId2Tag = (tagID) => {
    for (let tag of allowTags) {
      if (tag.tag_id === tagID) return tag;
    }
    return null;
  }

  const handleAddNewTags = () => {
    const newTag = inputValue.trim();
    addTag(newTag, 'en').then((tag) => {
      console.log("Added new tag:", tag);
      setAllowTags([...allowTags, tag]);
      setInputValue("");
    }).catch((error) => {
      console.error("Failed to add tag:", error);
      alert("添加标签失败: " + error.message);
    });
  };

  // {
  //   "tag_id": tag_id,
  //    "name": name,
  //    "lang": lang,
  //    "created_at": now,
  //    "updated_at": now
  // }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {word}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Tags:
        </Typography>
        <Grid container spacing={1} mb={2}>
          {allowTags.map((tag) => {
            const isSelected = wordTags.some(t => t.tag_id === tag.tag_id);
            return (
              <Grid item key={tag.name}>
                <Button
                  variant={isSelected ? "contained" : "outlined"}
                  size="small"
                  color={isSelected ? "secondary" : "primary"}
                  onClick={() => _addTagToWord(word, tag)}
                >
                  {tag.name}
                </Button>
              </Grid>
            );
          })}
        </Grid>


        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="New Tag"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button variant="contained" onClick={handleAddNewTags}>
            Add
          </Button>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Selected Tags:
        </Typography>
        <Grid container spacing={1} mb={2}>
          {wordTags.map((tag) => (
            <Grid item key={tag.id}>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                onClick={() => _removeTagFromWord(word, tag)}
              >
                {tagId2Tag(tag.tag_id)?.name || "Unknown"}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* <Button variant="contained" fullWidth onClick={handleSave}>
          Save
        </Button> */}
      </DialogContent>
    </Dialog>
  );
}
