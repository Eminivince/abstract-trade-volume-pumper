// frontend/src/pages/WalletGroupsPage.js
import React, { useEffect, useState } from "react";
import { getWalletGroups, activateWalletGroup } from "../api/walletGroups";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <--- import your AuthContext

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function WalletGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Access the logged-in user from auth context
  const { user } = useAuth();

  useEffect(() => {
    // If no user is logged in, navigate to /login
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Use the logged-in user's chatId
        const data = await getWalletGroups(user.chatId);
        setGroups(data);
      } catch (err) {
        console.error("Error fetching wallet groups:", err);
        setStatusMessage({
          type: "error",
          message: "Error fetching wallet groups.",
        });
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleActivate = async (groupId) => {
    if (!user) return; // safety check

    setIsLoading(true);
    setStatusMessage({ type: "", message: "" });

    try {
      await activateWalletGroup(user.chatId, groupId);
      setStatusMessage({ type: "success", message: "Wallet group activated." });

      // Refresh the list after activation
      const updated = await getWalletGroups(user.chatId);
      setGroups(updated);
    } catch (error) {
      console.error("Error activating group:", error);
      setStatusMessage({ type: "error", message: "Error activating group." });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, you might return null or a small message
  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <GroupIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
          <Typography variant="h5" component="h2">
            Wallet Groups
          </Typography>
        </Box>

        {statusMessage.message && (
          <Alert severity={statusMessage.type} sx={{ mb: 2 }}>
            {statusMessage.message}
          </Alert>
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}>
          <Typography variant="h6">Your Wallet Groups:</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => navigate("/wallet-group/new")}
            disabled={isLoading}>
            Create New Group
          </Button>
        </Box>

        <List>
          {groups.map((g) => (
            <ListItem
              key={g._id}
              secondaryAction={
                !g.isActive && (
                  <Tooltip title="Activate Wallet Group">
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleActivate(g._id)}
                      disabled={isLoading}>
                      Activate
                    </Button>
                  </Tooltip>
                )
              }
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                mb: 2,
              }}>
              <ListItemIcon>
                <GroupIcon color={g.isActive ? "success" : "action"} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{ wordBreak: "break-all" }}>
                    {g.name} {g.isActive && "(Active)"}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/")}
            startIcon={<ArrowBackIcon />}
            disabled={isLoading}>
            Back to Home
          </Button>
        </Box>

        {isLoading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default WalletGroupsPage;
