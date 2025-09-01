import React from "react";
import { Dialog, DialogActions, DialogTitle, Button } from "@mui/material";

export default function BookControlDialog({ book, onClose, onRead, onRemove }) {
  if (!book) return null;

  return (
    <Dialog open={!!book} onClose={onClose}>
      <DialogTitle>📖 {book.title}</DialogTitle>
      <DialogActions>
        <Button variant="contained" onClick={() => onRead(book)}>Read</Button>
        <Button color="error" onClick={() => onRemove(book)}>Remove</Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
