import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../common/api_user.js";
import { Box, TextField, Button, Typography, Container } from "@mui/material";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
    if (password !== confirmPassword) newErrors.password = "Passwords do not match";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
      newErrors.password = "Password must be at least 8 chars, include upper/lowercase and a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await signup(username.trim(), email.trim(), password);
      navigate("/login");
    } catch (err) {
      setErrors({ submit: err.message || "Signup failed" });
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2, // 横向内边距
      }}
    >
      <Box
        sx={{
          width: "100%",
          p: 3,
          border: "1px solid #ccc",
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" mb={2} textAlign="center">
          Sign Up
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            error={!!errors.username}
            helperText={errors.username}
            required
          />
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            error={!!errors.email}
            helperText={errors.email}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            error={!!errors.password}
            helperText={errors.password}
            required
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            error={!!errors.password}
            helperText={errors.password}
            required
          />
          {errors.submit && (
            <Typography color="error" variant="body2" mt={1}>
              {errors.submit}
            </Typography>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Sign Up
          </Button>
        </form>
        <Box mt={2} textAlign="center">
          <Link to="/login">Already have an account? Login</Link>
        </Box>
      </Box>
    </Container>
  );
}
