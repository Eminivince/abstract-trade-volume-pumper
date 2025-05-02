// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/login";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
  Link,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

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
      setUser(data.user);
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container
      maxWidth="sm"
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        mt: 8,
        mb: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          borderRadius: 2,
          background: (theme) =>
            `linear-gradient(to bottom, ${alpha(
              theme.palette.background.paper,
              0.9
            )}, ${theme.palette.background.paper})`,
          backdropFilter: "blur(8px)",
          boxShadow: (theme) =>
            `0 8px 32px ${alpha(theme.palette.primary.dark, 0.2)}`,
        }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={4}>
              <RocketLaunchIcon color="primary" sx={{ fontSize: 36, mr: 1 }} />
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 600,
                  background: (theme) =>
                    `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                Booster
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={0}
            initial="hidden"
            animate="visible">
            <Box
              sx={{
                p: 2,
                background: (theme) => alpha(theme.palette.primary.main, 0.1),
                borderRadius: "50%",
                mb: 2,
              }}>
              <LockOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={1}
            initial="hidden"
            animate="visible">
            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontWeight: 500,
                mb: 1,
              }}>
              Welcome Back
            </Typography>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={2}
            initial="hidden"
            animate="visible">
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              Sign in to your account to continue
            </Typography>
          </motion.div>
        </Box>

        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <Alert
              severity={status.type}
              sx={{
                mb: 2,
                borderRadius: 1,
              }}>
              {status.message}
            </Alert>
          </motion.div>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <motion.div
            variants={itemVariants}
            custom={3}
            initial="hidden"
            animate="visible">
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="span"
                      sx={{
                        color: "primary.main",
                        opacity: 0.7,
                      }}>
                      @
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={4}
            initial="hidden"
            animate="visible">
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end">
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={5}
            initial="hidden"
            animate="visible">
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.2,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: (theme) =>
                  `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                "&:hover": {
                  boxShadow: (theme) =>
                    `0 6px 16px ${alpha(theme.palette.primary.main, 0.6)}`,
                },
              }}>
              {isLoading ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Signing in...
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={6}
            initial="hidden"
            animate="visible">
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/signup")}
                  disabled={isLoading}
                  sx={{
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}>
                  Create an account
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
