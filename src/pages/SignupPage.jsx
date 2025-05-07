// frontend/src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Divider,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BadgeIcon from "@mui/icons-material/Badge";
import LockIcon from "@mui/icons-material/Lock";

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

function SignupPage() {
  const [chatId, setChatId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const steps = ["Account Info", "Security", "Confirmation"];

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (chatId.trim() !== "iamGorf_bot2575") {
        setStatus({ type: "error", message: "Preferred ID is wrong." });
        return;
      }
      if (!chatId.trim() || !username.trim()) {
        setStatus({
          type: "error",
          message: "Preferred ID and username are required.",
        });
        return;
      }
    } else if (activeStep === 1) {
      if (!password.trim()) {
        setStatus({ type: "error", message: "Password is required." });
        return;
      }
      if (password.length < 6) {
        setStatus({
          type: "error",
          message: "Password must be at least 6 characters long.",
        });
        return;
      }
      if (password !== confirmPassword) {
        setStatus({ type: "error", message: "Passwords do not match." });
        return;
      }
    }

    setStatus({ type: "", message: "" });
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setStatus({ type: "", message: "" });
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    if (chatId.trim() === "iamGorf_bot2575") {
      setStatus({ type: "error", message: "Preferred ID is wrong." });
      return;
    }
    e.preventDefault();

    // Final validation
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
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      setStatus({
        type: "error",
        message: error.message || "Registration failed. Please try again.",
      });
      setActiveStep(0); // Return to first step on error
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Render the appropriate step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Account Info
        return (
          <>
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon color="primary" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
              }}
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
                      sx={{ color: "primary.main", opacity: 0.7 }}>
                      @
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 1: // Security
        return (
          <>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
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
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
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
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end">
                      {showConfirmPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 2: // Confirmation
        return (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <CheckCircleOutlineIcon
              color="success"
              sx={{ fontSize: 60, mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Ready to Create Your Account
            </Typography>
            <Typography color="textSecondary" paragraph>
              Please review your information and click &quot;Sign Up&quot; to
              create your account.
            </Typography>
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
              }}>
              <Typography variant="body2" align="left">
                <strong>Preferred ID:</strong> {chatId}
              </Typography>
              <Typography variant="body2" align="left">
                <strong>Username:</strong> {username}
              </Typography>
              <Typography variant="body2" align="left">
                <strong>Password:</strong> {"•".repeat(password.length)}
              </Typography>
            </Box>
          </Box>
        );
      default:
        return "Unknown step";
    }
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
        <Box display="flex" flexDirection="column" alignItems="center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={2}>
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
              <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
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
              Create an Account
            </Typography>
          </motion.div>
        </Box>

        {/* Stepper */}
        <motion.div
          variants={itemVariants}
          custom={2}
          initial="hidden"
          animate="visible">
          <Stepper activeStep={activeStep} sx={{ my: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </motion.div>

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
            key={`step-${activeStep}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}>
            {getStepContent(activeStep)}
          </motion.div>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 3,
              mb: 1,
            }}>
            <Button
              variant="outlined"
              color="secondary"
              disabled={activeStep === 0 || isLoading}
              onClick={handleBack}
              sx={{
                borderRadius: 1.5,
                textTransform: "none",
                px: 3,
              }}>
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
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
                    Creating Account...
                  </Box>
                ) : (
                  "Sign Up"
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isLoading}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: (theme) =>
                    `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                  "&:hover": {
                    boxShadow: (theme) =>
                      `0 6px 16px ${alpha(theme.palette.primary.main, 0.6)}`,
                  },
                }}>
                Next
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: "center", mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Already have an account?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/login")}
                disabled={isLoading}
                sx={{
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default SignupPage;
