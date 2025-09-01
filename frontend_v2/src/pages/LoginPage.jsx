import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, loginAsGuest } from "../common/api_user.js";
import { Box, TextField, Button, Typography, useMediaQuery, useTheme } from "@mui/material";

export default function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const handleGuest = async () => {
    if (!window.confirm("Guest login has limited access. Continue?")) return;
    try {
      await loginAsGuest();
      navigate("/home");
    } catch (err) {
      setError(err.message || "Guest login failed");
    }
  };

  return (
    <Box
      sx={{
        // minHeight: "100vh",           // 占满屏幕高度
        height: "100%",           // 占满屏幕高度
        display: "flex",
        justifyContent: "center",     // 水平居中
        alignItems: "center",         // 垂直居中
        bgcolor: "background.default", // 背景色随主题
        p: 2,
      }}
    >
      <Box
        sx={{
          width: isMobile ? "90%" : 400,
          p: isMobile ? 2 : 3,
          border: "1px solid #ccc",
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Typography variant="h5" mb={isMobile ? 2 : 3} textAlign="center">
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1, mb: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, py: isMobile ? 1.5 : 1.8 }}
          >
            Login
          </Button>
        </form>

        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 1, py: isMobile ? 1.5 : 1.8 }}
          onClick={handleGuest}
        >
          Login as Guest
        </Button>

        <Box mt={2} textAlign="center">
          <Link to="/signup" style={{ fontSize: isMobile ? "0.9rem" : "1rem" }}>
            Don't have an account? Sign up
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
