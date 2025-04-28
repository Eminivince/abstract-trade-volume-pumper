// frontend/src/pages/CreateWalletGroupPage.js
import { useState } from "react";
import { createWalletGroup } from "../api/walletGroups";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
import GroupAddIcon from "@mui/icons-material/GroupAdd";

function CreateWalletGroupPage() {
  const { user } = useAuth(); // we can get { chatId, ... } here
  const [groupName, setGroupName] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    if (!user?.chatId) {
      setStatusMessage({ type: "error", message: "You must log in first!" });
      return;
    }
    setIsLoading(true);
    setStatusMessage({ type: "", message: "" });
    try {
      const newGroup = await createWalletGroup(user.chatId, groupName);
      setStatusMessage({
        type: "success",
        message: `Created wallet group: ${newGroup.walletGroup.name}`,
      });
      setGroupName("");
    } catch (err) {
      console.error("Error creating group", err);
      setStatusMessage({ type: "error", message: "Error creating group." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <GroupAddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h5">
            Create Wallet Group
          </Typography>
        </Box>

        {statusMessage.message && (
          <Alert
            severity={statusMessage.type}
            sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {statusMessage.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            required
            fullWidth
            id="groupName"
            label="Group Name"
            name="groupName"
            placeholder="Enter group name"
            margin="normal"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
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
            {isLoading ? "Creating..." : "Create Group"}
          </Button>
        </Box>

        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
          disabled={isLoading}>
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
}

export default CreateWalletGroupPage;
