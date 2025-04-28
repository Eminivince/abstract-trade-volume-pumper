// frontend/src/pages/BurnPage.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { burnETH } from "../api/transactions"; // Ensure this function is correctly implemented to handle authenticated requests
import { useAuth } from "../context/AuthContext"; // Import AuthContext
import { getActiveToken } from "../api/tokens"; // Ensure this API call fetches active token data
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function BurnPage() {
  const [burnAmount, setBurnAmount] = useState("");
  const [result, setResult] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [activeToken, setActiveToken] = useState(null);

  const navigate = useNavigate();
  const { user, token } = useAuth(); // Access user and token from AuthContext

  // Fetch active token data when component mounts or when user/token changes
  useEffect(() => {
    const fetchActiveToken = async () => {
      if (user && token) {
        try {
          const tokenData = await getActiveToken(user.chatId);
          setActiveToken(tokenData);
        } catch (err) {
          console.error("Error fetching active token:", err);
          setResult({
            type: "error",
            message: "Failed to fetch active token data.",
          });
        }
      }
    };

    fetchActiveToken();
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!burnAmount.trim()) {
      setResult({
        type: "error",
        message: "Please enter a valid burn amount.",
      });
      return;
    }

    const burnAmountNumber = parseFloat(burnAmount);
    if (isNaN(burnAmountNumber) || burnAmountNumber <= 0) {
      setResult({
        type: "error",
        message: "Please enter a positive number for the burn amount.",
      });
      return;
    }

    const fetchedToken = await getActiveToken(user.chatId);
    setActiveToken(fetchedToken);

    if (!fetchedToken) {
      setResult({ type: "error", message: "No active token selected." });
      return;
    }

    setIsLoading(true);
    setResult({ type: "", message: "" });

    const chatId = user.chatId;

    try {
      // Initiate the burn process using authenticated user data
      const resp = await burnETH(chatId, burnAmountNumber, token);
      setResult({
        type: "success",
        message: `🔥 Burn completed.\nSuccess: ${resp.successCount}, Fail: ${resp.failCount}`,
      });
      setBurnAmount("");
    } catch (err) {
      console.error("Error burning ETH:", err);
      // Display specific error message if available
      if (err.response && err.response.data && err.response.data.error) {
        setResult({
          type: "error",
          message: `❌ Error: ${err.response.data.error}`,
        });
      } else {
        setResult({
          type: "error",
          message: "❌ An error occurred while burning ETH.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copying text to clipboard
  const handleCopy = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setResult({
          type: "success",
          message: `${label} copied to clipboard!`,
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        setResult({ type: "error", message: `❌ Failed to copy ${label}.` });
      });
  };

  // If user is not logged in, prompt them to log in
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <LocalFireDepartmentIcon color="secondary" sx={{ fontSize: 40 }} />
            <Typography variant="h5">Burn ETH Tokens</Typography>
            <Typography variant="body1">
              Please log in to burn ETH tokens.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/login")}
              startIcon={<LocalFireDepartmentIcon />}>
              Go to Login
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, width: "100%" }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" alignItems="center">
            <LocalFireDepartmentIcon
              color="secondary"
              sx={{ fontSize: 40, mr: 1 }}
            />
            <Typography variant="h5" component="h2">
              Burn ETH Tokens
            </Typography>
          </Box>

          {/* Active Token Information */}
          {activeToken && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Active Token:</strong> {activeToken.symbol} (
                {activeToken.name})
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  <strong>Token Address:</strong> {activeToken.address}
                </Typography>
                <Tooltip title="Copy Token Address">
                  <IconButton
                    aria-label="copy token address"
                    onClick={() =>
                      handleCopy(activeToken.address, "Token Address")
                    }>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* Burn Amount Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Burn Amount (ETH)"
                type="number"
                inputProps={{ step: "0.0001", min: "0" }}
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                fullWidth
                required
                disabled={isLoading}
                variant="outlined"
              />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                fullWidth
                disabled={isLoading}
                startIcon={isLoading && <CircularProgress size={20} />}>
                {isLoading ? "Burning..." : "Burn ETH"}
              </Button>
            </Stack>
          </Box>

          {/* Result Message */}
          {result.message && (
            <Alert severity={result.type} sx={{ whiteSpace: "pre-wrap" }}>
              {result.message}
            </Alert>
          )}

          {/* Back to Home Button */}
          <Box>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => navigate("/")}
              startIcon={<LocalFireDepartmentIcon />}>
              Back to Home
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default BurnPage;
