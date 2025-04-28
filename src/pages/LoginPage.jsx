// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/login"; // the helper we made
import { useAuth } from "../context/AuthContext";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth(); // Keep using setUser as per your original code

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!username.trim()) {
      setStatus({ type: "error", message: "Please enter your username." });
      return;
    }

    if (!password.trim()) {
      setStatus({ type: "error", message: "Please enter your password." });
      return;
    }

    if (password.trim().length < 6) {
      setStatus({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const data = await loginUser(username.trim(), password.trim());
      // data => { message, user: { chatId, activeWalletGroupId, ... } }
      setUser(data.user); // store in context
      setStatus({ type: "success", message: "Login successful!" });
      // Navigate to home page after a short delay to show success message
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setStatus({
        type: "error",
        message:
          "Login failed: " + (error.response?.data?.error || error.message),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: 8,
        mb: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <Paper elevation={6} sx={{ p: 4, width: "100%" }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              mb: 4,
            }}
            to="/">
            Manual Booster
          </Typography>
          <LockOutlinedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h5">
            Login
          </Typography>
        </Box>

        {status.message && (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
            startIcon={isLoading && <CircularProgress size={20} />}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          <Button
            fullWidth
            variant="text"
            color="secondary"
            onClick={() => navigate("/signup")} // Assuming there's a registration page
            disabled={isLoading}>
            Don't have an account? Register
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
