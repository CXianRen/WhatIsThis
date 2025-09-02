import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Stack } from "@mui/material";

export default function ToolBarPanel({ applist = [], anchorPos, open, onClose }) {
  const toolbarRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open || !anchorPos) return;

    const updatePos = () => {
      if (!toolbarRef.current) return;
      const rect = toolbarRef.current.getBoundingClientRect();
      let x = anchorPos.x;
      let y = anchorPos.y;

      // 水平边界
      if (x - rect.width / 2 < 0) x = rect.width / 2;
      if (x + rect.width / 2 > window.innerWidth) x = window.innerWidth - rect.width / 2;

      // 垂直边界
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;

      setPos({ x, y });
    };

    updatePos();
  }, [anchorPos, open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        onClose?.();
      }
    };
    const handleScroll = () => open && onClose?.();

    window.addEventListener("mousedown", handleClickOutside, true);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside, true);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Box
      ref={toolbarRef}
      sx={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        display: "flex",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: 1,
        p: 1,
        boxShadow: 3,
        zIndex: 1300,
        transform: "translate(-50%, 0)"
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
  );
}
