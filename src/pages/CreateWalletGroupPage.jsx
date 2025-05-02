// frontend/src/pages/CreateWalletGroupPage.js
import { useState } from "react";
import { motion } from "framer-motion";
import { createWalletGroup } from "../api/walletGroups";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { IS_PRODUCTION } from "../config";

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
  useTheme,
  AlertTitle,
  Divider,
  IconButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ClearIcon from "@mui/icons-material/Clear";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.5,
    },
  },
};

function CreateWalletGroupPage() {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    if (!user?.chatId) {
      setStatusMessage({ type: "error", message: "You must log in first!" });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: "", message: "" });
    setShowSuccess(false);

    try {
      if (!IS_PRODUCTION) {
        console.log(
          `[DEV] Creating wallet group "${groupName}" for user:`,
          user.chatId
        );
      }

      const newGroup = await createWalletGroup(user.chatId, groupName);

      setStatusMessage({
        type: "success",
        message: `Wallet group "${newGroup.walletGroup.name}" created successfully!`,
      });
      setShowSuccess(true);
      setGroupName("");
    } catch (err) {
      console.error("Error creating group", err);
      setStatusMessage({
        type: "error",
        message: `Error creating wallet group: ${
          err.message || "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setGroupName("");
    setStatusMessage({ type: "", message: "" });
  };

  return (
    <Container maxWidth="sm" sx={{ my: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
            position: "relative",
            overflow: "hidden",
          }}>
          {/* Header */}
          <Box
            component={motion.div}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}>
            <Box
              sx={{
                background: "linear-gradient(45deg, #3f51b5, #2196f3)",
                borderRadius: "50%",
                padding: 1.5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: theme.shadows[4],
                mb: 2,
              }}>
              <GroupAddIcon sx={{ fontSize: 40, color: "#fff" }} />
            </Box>
            <Typography
              component="h1"
              variant="h4"
              align="center"
              fontWeight="bold"
              gutterBottom>
              Create Wallet Group
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              sx={{ maxWidth: 400 }}>
              Create a new wallet group to organize and manage your wallets for
              trading
            </Typography>
          </Box>

          {/* Status Message */}
          {statusMessage.message && (
            <Alert
              severity={statusMessage.type}
              sx={{
                mb: 3,
                whiteSpace: "pre-wrap",
                borderRadius: 2,
              }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setStatusMessage({ type: "", message: "" })}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }>
              <AlertTitle>
                {statusMessage.type === "success" ? "Success" : "Error"}
              </AlertTitle>
              {statusMessage.message}

              {statusMessage.type === "success" && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    onClick={() => navigate("/wallet-groups")}
                    startIcon={<CheckCircleIcon />}
                    sx={{ mr: 1 }}>
                    View All Groups
                  </Button>
                </Box>
              )}
            </Alert>
          )}

          {/* Form */}
          <Box
            component={motion.form}
            variants={formVariants}
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}>
            <TextField
              required
              fullWidth
              id="groupName"
              label="Group Name"
              name="groupName"
              placeholder="Enter a unique name for your wallet group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              autoFocus
              InputProps={{
                endAdornment: groupName && (
                  <InputAdornment position="end">
                    <IconButton onClick={clearForm} edge="end" size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupAddIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Tooltip
                title="A wallet group can contain multiple wallet addresses. You can activate one group at a time for trading."
                arrow>
                <HelpOutlineIcon
                  color="action"
                  fontSize="small"
                  sx={{ mr: 1 }}
                />
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                Group names should be descriptive and unique
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading || !groupName.trim()}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                position: "relative",
                overflow: "hidden",
              }}>
              {isLoading ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Creating...
                </>
              ) : (
                "Create Wallet Group"
              )}
            </Button>

            <Divider sx={{ my: 1 }} />

            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate("/wallet-groups")}
              startIcon={<ArrowBackIcon />}
              disabled={isLoading}
              sx={{ borderRadius: 2 }}>
              Back to Wallet Groups
            </Button>
          </Box>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            mt={4}
            textAlign="center"
            sx={{
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              opacity: 0.7,
            }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()}
              {!IS_PRODUCTION && ` - Running in Development Mode`}
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}

export default CreateWalletGroupPage;
