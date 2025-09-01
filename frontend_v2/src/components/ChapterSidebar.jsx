import React, { useState, useEffect } from "react";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";

export default function ChapterSidebar({ chapters = [], onSelect, initialChapter = 0 }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialChapter);

  useEffect(() => {
    setActiveIndex(initialChapter);
  }, [initialChapter]);

  const handleSelect = (index) => {
    setActiveIndex(index);
    onSelect?.(index);
    setOpen(false);
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)} style={{ position: 'fixed', top: 10, left: 10, zIndex: 1500 }}>
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
      >
        <List style={{ width: 250 }}>
          {chapters.map((ch, idx) => (
            <ListItem
              button
              key={ch.chapter_id}
              selected={idx === activeIndex}
              onClick={() => handleSelect(idx)}
            >
              <ListItemText primary={ch.chapter_title} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}
