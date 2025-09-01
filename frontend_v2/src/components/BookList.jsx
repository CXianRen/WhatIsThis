import React from "react";
import { Box } from "@mui/material";
import BookCard from "./BookCard";

export default function BookList({ books, onBookClick }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} onClick={() => onBookClick(book)} />
      ))}
    </Box>
  );
}
