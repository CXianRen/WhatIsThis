import React, { useEffect, useState, useRef } from "react";
import { Box, Button, Popper, Stack } from "@mui/material";

export default function ToolBarPanel({ applist = [], anchorPos, open, onClose }) {
  const popperRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && anchorPos) {
      // 计算浮动位置
      const { x, y } = anchorPos;
      const toolbar = popperRef.current;
      if (!toolbar) return;

      const rect = toolbar.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = x - rect.width / 2;
      let top = y + 10;

      if (left < 10) left = 10;
      else if (left + rect.width > viewportWidth - 10)
        left = viewportWidth - rect.width - 10;

      if (top + rect.height > viewportHeight - 10)
        top = y - rect.height - 10;

      setPosition({ left, top });
    }
  }, [open, anchorPos]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && popperRef.current && !popperRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const handleScroll = () => {
      if (open) onClose?.();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Popper open={open} anchorEl={document.body} style={{ position: "fixed", top: position.top, left: position.left, zIndex: 1300 }}>
      <Box
        ref={popperRef}
        sx={{
          display: "flex",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: 1,
          p: 1,
          boxShadow: 3,
        }}
      >
        <Stack direction="row" spacing={1}>
          {applist.map((app) => (
            <Button
              key={app.name}
              variant="outlined"
              size="small"
              title={app.name}
              onClick={(e) => {
                app.onclick?.(e);
                onClose?.();
              }}
            >
              {app.logo || app.name}
            </Button>
          ))}
        </Stack>
      </Box>
    </Popper>
  );
}
