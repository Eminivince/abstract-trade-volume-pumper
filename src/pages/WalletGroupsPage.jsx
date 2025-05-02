// frontend/src/pages/WalletGroupsPage.js
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getWalletGroups, activateWalletGroup } from "../api/walletGroups";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IS_PRODUCTION } from "../config";

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
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  AlertTitle,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupsIcon from "@mui/icons-material/Groups";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

function WalletGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(null); // Track which group is being activated
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Access the logged-in user from auth context
  const { user } = useAuth();

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      // Use the logged-in user's chatId
      if (!IS_PRODUCTION) {
        console.log("[DEV] Fetching wallet groups for user:", user.chatId);
      }
      const data = await getWalletGroups(user.chatId);
      setGroups(data);
      setStatusMessage({ type: "", message: "" });
    } catch (err) {
      console.error("Error fetching wallet groups:", err);
      setStatusMessage({
        type: "error",
        message: `Error fetching wallet groups: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no user is logged in, navigate to /login
    if (!user) {
      navigate("/login");
      return;
    }

    fetchGroups();
  }, [user, navigate]);

  const handleActivate = async (groupId) => {
    if (!user) return; // safety check

    setIsActivating(groupId);
    setStatusMessage({ type: "", message: "" });

    try {
      await activateWalletGroup(user.chatId, groupId);
      setStatusMessage({
        type: "success",
        message: "Wallet group activated successfully!",
      });

      // Refresh the list after activation
      const updated = await getWalletGroups(user.chatId);
      setGroups(updated);
    } catch (error) {
      console.error("Error activating group:", error);
      setStatusMessage({
        type: "error",
        message: `Error activating group: ${error.message}`,
      });
    } finally {
      setIsActivating(null);
    }
  };

  const handleRefresh = () => {
    fetchGroups();
  };

  const handleViewGroup = (groupId) => {
    navigate(`/view-wallet-group/${groupId}`);
  };

  // If user is not logged in, you might return null or a small message
  if (!user) return null;

  const activeGroup = groups.find((g) => g.isActive);

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
            position: "relative",
            overflow: "hidden",
          }}>
          {/* Header with title and actions */}
          <Box
            component={motion.div}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              mb: 3,
              gap: 2,
            }}>
            <Box display="flex" alignItems="center">
              <GroupsIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Wallet Groups
                </Typography>
                {activeGroup && (
                  <Typography
                    variant="subtitle1"
                    color="primary.light"
                    sx={{ mt: 0.5 }}>
                    Active: {activeGroup.name}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignSelf: isMobile ? "flex-end" : "center",
              }}>
              <Tooltip title="Refresh Groups">
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleIcon />}
                onClick={() => navigate("/wallet-group/new")}
                disabled={isLoading}
                sx={{ borderRadius: 2 }}>
                Create New
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/")}
                startIcon={<ArrowBackIcon />}
                disabled={isLoading}
                sx={{ borderRadius: 2 }}>
                Back
              </Button>
            </Box>
          </Box>

          {/* Status messages */}
          <AnimatePresence mode="wait">
            {statusMessage.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}>
                <Alert
                  severity={statusMessage.type}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                  }}
                  onClose={() => setStatusMessage({ type: "", message: "" })}>
                  <AlertTitle>
                    {statusMessage.type === "success" ? "Success" : "Error"}
                  </AlertTitle>
                  {statusMessage.message}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group listing section */}
          <Box component="section">
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${theme.palette.divider}`,
                pb: 1,
                mb: 3,
              }}>
              <FolderOpenIcon sx={{ mr: 1 }} />
              Your Wallet Groups
              <Chip
                label={`${groups.length} ${
                  groups.length === 1 ? "group" : "groups"
                }`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            </Typography>

            {isLoading ? (
              // Loading skeleton
              <Box component={motion.div} variants={containerVariants}>
                {[1, 2, 3].map((_, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.03)",
                      }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center">
                        <Box display="flex" alignItems="center">
                          <Skeleton
                            variant="circular"
                            width={40}
                            height={40}
                            sx={{ mr: 2 }}
                          />
                          <Skeleton variant="text" width={120} height={24} />
                        </Box>
                        <Skeleton
                          variant="rectangular"
                          width={100}
                          height={36}
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            ) : groups.length === 0 ? (
              // Empty state
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible">
                <Paper
                  sx={{
                    py: 4,
                    px: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px dashed rgba(255,255,255,0.2)",
                  }}>
                  <FolderOpenIcon
                    sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Wallet Groups Found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 3, maxWidth: 400 }}>
                    Create your first wallet group to start managing your crypto
                    assets. Each wallet group can contain multiple wallets.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleIcon />}
                    onClick={() => navigate("/wallet-group/new")}>
                    Create Your First Group
                  </Button>
                </Paper>
              </motion.div>
            ) : (
              // Wallet group list
              <AnimatePresence>
                <motion.div variants={containerVariants}>
                  {groups.map((group) => (
                    <motion.div
                      key={group._id}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={itemVariants}
                      layout>
                      <Card
                        elevation={group.isActive ? 3 : 1}
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          border: group.isActive
                            ? `1px solid ${theme.palette.primary.main}`
                            : "1px solid rgba(255,255,255,0.1)",
                          background: group.isActive
                            ? `linear-gradient(to right, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.02))`
                            : "rgba(255,255,255,0.03)",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            boxShadow: theme.shadows[5],
                          },
                        }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={1}>
                            <Box display="flex" alignItems="center">
                              <GroupIcon
                                color={group.isActive ? "primary" : "action"}
                                sx={{ fontSize: 28, mr: 2 }}
                              />
                              <Box>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    wordBreak: "break-all",
                                    fontWeight: group.isActive ? 600 : 400,
                                    color: group.isActive
                                      ? "primary.main"
                                      : "text.primary",
                                  }}>
                                  {group.name}
                                </Typography>
                                {group.isActive && (
                                  <Chip
                                    label="Active"
                                    size="small"
                                    color="primary"
                                    sx={{ mr: 1, mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Box>

                            <Box display="flex" gap={1}>
                              <Tooltip title="View Wallets">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleViewGroup(group._id)}
                                  sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                  }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {!group.isActive && (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  startIcon={
                                    isActivating === group._id ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <CheckCircleIcon />
                                    )
                                  }
                                  onClick={() => handleActivate(group._id)}
                                  disabled={isActivating !== null}
                                  size="small"
                                  sx={{ borderRadius: 1 }}>
                                  {isActivating === group._id
                                    ? "Activating..."
                                    : "Activate"}
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </Box>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
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

export default WalletGroupsPage;
