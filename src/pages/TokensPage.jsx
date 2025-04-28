// frontend/src/pages/TokensPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTokens, addToken, activateToken } from "../api/tokens";
import { useAuth } from "../context/AuthContext"; // <--- import your AuthContext

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  IconButton,
  // ArrowBackIcon,
} from "@mui/material";
import TokenIcon from "@mui/icons-material/Token";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function TokensPage() {
  const [tokens, setTokens] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [newTokenAddress, setNewTokenAddress] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth(); // get the logged-in user from context

  // Fetch tokens for the logged-in user's chatId
  const fetchTokens = async () => {
    if (!user?.chatId) return; // no user => no fetch
    try {
      const data = await getTokens(user.chatId);
      setTokens(data);
    } catch (err) {
      console.error("Error getting tokens", err);
      setStatusMessage({ type: "error", message: "Error getting tokens" });
    }
  };

  useEffect(() => {
    if (!user) {
      // If not logged in, redirect to login
      navigate("/login");
      return;
    }
    // If user is defined, fetch tokens
    fetchTokens();
  }, [user, navigate]);

  // Handle adding a new token
  const handleAddToken = async (e) => {
    e.preventDefault();
    if (!newTokenAddress.trim()) return;
    if (!user?.chatId) return; // extra safety

    try {
      const added = await addToken(user.chatId, newTokenAddress.trim());
      setStatusMessage({
        type: "success",
        message: `Token added/active: ${added.symbol} (${added.name})`,
      });
      setNewTokenAddress("");
      fetchTokens();
    } catch (err) {
      console.error("Error adding token", err);
      setStatusMessage({ type: "error", message: "Error adding token" });
    }
  };

  // Handle activating an existing token
  const handleActivate = async (tokenId) => {
    try {
      await activateToken(user.chatId, tokenId);
      setStatusMessage({ type: "success", message: "Token activated." });
      fetchTokens();
    } catch (err) {
      console.error("Error activating token", err);
      setStatusMessage({ type: "error", message: "Error activating token" });
    }
  };

  // Handle copying text to clipboard
  const handleCopy = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setStatusMessage({
          type: "success",
          message: `${label} copied to clipboard!`,
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        setStatusMessage({
          type: "error",
          message: `Failed to copy ${label}.`,
        });
      });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, width: "100%" }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" alignItems="center">
            <TokenIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
            <Typography variant="h5" component="h2">
              Manage Tokens
            </Typography>
          </Box>

          {/* Status Message */}
          {statusMessage.message && (
            <Alert
              severity={statusMessage.type}
              sx={{ wordBreak: "break-word" }}>
              {statusMessage.message}
            </Alert>
          )}

          {/* Add Token Form */}
          <Box component="form" onSubmit={handleAddToken} noValidate>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                fullWidth
                id="newTokenAddress"
                label="Contract Address"
                name="newTokenAddress"
                placeholder="Enter contract address"
                value={newTokenAddress}
                onChange={(e) => setNewTokenAddress(e.target.value)}
                disabled={!user}
                variant="outlined"
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<AddCircleIcon />}
                disabled={!user}
                sx={{ height: { xs: "auto", sm: "56px" } }}>
                Add Token
              </Button>
            </Stack>
          </Box>

          {/* Tokens List */}
          <Typography variant="h6" gutterBottom>
            Your Tokens:
          </Typography>
          <List>
            {tokens.map((t) => (
              <ListItem
                key={t._id}
                secondaryAction={
                  !t.isActive && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleActivate(t._id)}
                      startIcon={<CheckCircleIcon />}
                      size="small">
                      Activate
                    </Button>
                  )
                }
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  mb: 1,
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}>
                <Box display="flex" alignItems="center" width="100%">
                  <ListItemIcon sx={{ minWidth: "40px" }}>
                    <TokenIcon color={t.isActive ? "success" : "action"} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{ wordBreak: "break-all" }}>
                        {t.symbol} ({t.name})
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{ wordBreak: "break-all" }}>
                        {t.isActive ? "Active" : "Inactive"}
                      </Typography>
                    }
                  />
                </Box>
                {/* Optionally, add copy buttons for addresses or other details */}
              </ListItem>
            ))}
          </List>

          {/* Back to Home Button */}
          <Box display="flex" justifyContent="center">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/")}
              startIcon={<ArrowBackIcon />}
              fullWidth>
              Back to Home
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default TokensPage;
