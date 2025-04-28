// frontend/src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import PersonAddIcon from "@mui/icons-material/PersonAdd";

function SignupPage() {
  const [chatId, setChatId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!chatId.trim() || !username.trim() || !password.trim()) {
      setStatus({ type: "error", message: "All fields are required." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      setStatus({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(
        // "http://localhost:5080/api/signup",
        "https://abstract-pump-109a297e2430.herokuapp.com/api/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: chatId.trim(),
            username: username.trim(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setUser(data.user);
      setStatus({ type: "success", message: "Registration successful!" });

      // Navigate to home page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      setStatus({
        type: "error",
        message: error.message || "Registration failed. Please try again.",
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
          <PersonAddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h5">
            Sign Up
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
            id="chatId"
            label="Preferred ID"
            name="chatId"
            autoComplete="chat-id"
            margin="normal"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            disabled={isLoading}
          />
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
            autoComplete="new-password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>
          <Button
            fullWidth
            variant="text"
            color="secondary"
            onClick={() => navigate("/login")}
            disabled={isLoading}>
            Already have an account? Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default SignupPage;
