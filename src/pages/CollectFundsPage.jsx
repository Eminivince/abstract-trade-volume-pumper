// frontend/src/pages/CollectFundsPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { collectFunds } from "../api/transactions";
import { useAuth } from "../context/AuthContext"; // Import AuthContext

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

function CollectFundsPage() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth(); // Get the logged-in user from context

  const handleCollect = async () => {
    if (!user) {
      setResult("Please log in to collect funds.");
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const resp = await collectFunds(user.chatId);
      setResult(
        `Funds Collected.\nSuccess: ${resp.successCount}, Fail: ${resp.failCount}, Total Collected: ${resp.totalCollected} ETH`
      );
    } catch (err) {
      console.error("Error collecting funds:", err);
      setResult(
        err.response?.data?.error || "An error occurred while collecting funds."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, prompt them to log in
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Collect Funds
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please log in to collect funds.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}
            startIcon={<MonetizationOnIcon />}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <MonetizationOnIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h5">
            Collect Funds
          </Typography>
        </Box>

        {result && (
          <Alert
            severity={
              result.startsWith("Funds Collected") ? "success" : "error"
            }
            sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {result}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleCollect}
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
            sx={{ mt: 2, mb: 2 }}>
            {isLoading ? "Collecting..." : "Collect Funds"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/")}
            sx={{ mt: 1 }}>
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default CollectFundsPage;
