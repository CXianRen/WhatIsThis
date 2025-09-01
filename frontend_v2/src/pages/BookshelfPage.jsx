import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Snackbar, Alert } from "@mui/material";
import BookFilter from "../components/BookFilter";
import BookList from "../components/BookList";
import BookControlDialog from "../components/BookControlDialog";
import { fetchUserBooks, removeBookFromShelf } from "../common/api_book.js";
import { useNavigate } from "react-router-dom";

export default function BookshelfPage() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ language: "", level: "" });
  const [selectedBook, setSelectedBook] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await fetchUserBooks();
      setBooks(data);
      setFilteredBooks(data);
    } catch (err) {
      setSnackbar({ open: true, message: "Error loading books", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = [...books];

    if (newFilters.language) {
      filtered = filtered.filter(b =>
        b.languages.some(l => (l.lang || "").toUpperCase() === newFilters.language.toUpperCase())
      );
    }

    if (newFilters.level) {
      filtered = filtered.filter(b =>
        b.languages.some(l => Array.isArray(l.level) && l.level.includes(newFilters.level))
      );
    }

    setFilteredBooks(filtered);
  };

  const handleRemoveBook = async (book) => {
    try {
      const res = await removeBookFromShelf(book.id);
      if (res.success) {
        setBooks(prev => prev.filter(b => b.id !== book.id));
        setFilteredBooks(prev => prev.filter(b => b.id !== book.id));
        setSnackbar({ open: true, message: "Book removed", severity: "success" });
      } else {
        throw new Error(res.error || "Remove failed");
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
    setSelectedBook(null);
  };

  return (
    <Box sx={{
      p: 2, maxWidth: 960,      // 最大宽度，可根据需求调整
      mx: "auto"                // 水平居中
    }}>
      <Typography variant="h4" gutterBottom>📚 My Bookshelf</Typography>

      <BookFilter filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredBooks.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6">No books available</Typography>
          <Typography
            variant="body2"
            sx={{ color: "primary.main", cursor: "pointer", mt: 1 }}
            onClick={() => navigate("/library")}
          >
            Add books from library →
          </Typography>
        </Box>
      ) : (
        <BookList books={filteredBooks} onBookClick={setSelectedBook} />
      )}

      <BookControlDialog
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onRead={(book) => navigate("/reader", { state: book })}
        onRemove={handleRemoveBook}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
