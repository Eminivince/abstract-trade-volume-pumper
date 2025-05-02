// frontend/src/pages/TokensPage.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { getTokens, addToken, activateToken } from "../api/tokens";
import { useAuth } from "../context/AuthContext";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Stack,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  CircularProgress,
  Grid,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TokenIcon from "@mui/icons-material/Token";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LaunchIcon from "@mui/icons-material/Launch";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

function TokensPage() {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all, active, inactive

  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // Fetch tokens for the logged-in user's chatId
  const fetchTokens = async () => {
    if (!user?.chatId) return;
    try {
      setStatusMessage({ type: "info", message: "Loading tokens..." });
      const data = await getTokens(user.chatId);
      setTokens(data);
      setFilteredTokens(data);
      setStatusMessage({ type: "", message: "" });
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

  // Filter tokens based on search query and filter type
  useEffect(() => {
    if (!tokens.length) return;

    let filtered = [...tokens];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (token) =>
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy === "active") {
      filtered = filtered.filter((token) => token.isActive);
    } else if (filterBy === "inactive") {
      filtered = filtered.filter((token) => !token.isActive);
    }

    setFilteredTokens(filtered);
  }, [tokens, searchQuery, filterBy]);

  // Handle adding a new token
  const handleAddToken = async (e) => {
    e.preventDefault();
    if (!newTokenAddress.trim()) return;
    if (!user?.chatId) return; // extra safety

    try {
      setIsAdding(true);
      const added = await addToken(user.chatId, newTokenAddress.trim());
      setStatusMessage({
        type: "success",
        message: `Token added/active: ${added.symbol} (${added.name})`,
      });
      setNewTokenAddress("");
      fetchTokens();
    } catch (err) {
      console.error("Error adding token", err);
      setStatusMessage({
        type: "error",
        message: `Error adding token: ${
          err.response?.data?.error || err.message
        }`,
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle activating an existing token
  const handleActivate = async (tokenId) => {
    try {
      setStatusMessage({ type: "info", message: "Activating token..." });
      await activateToken(user.chatId, tokenId);
      setStatusMessage({ type: "success", message: "Token activated." });
      fetchTokens();
    } catch (err) {
      console.error("Error activating token", err);
      setStatusMessage({
        type: "error",
        message: `Error activating token: ${
          err.response?.data?.error || err.message
        }`,
      });
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

        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatusMessage({ type: "", message: "" });
        }, 3000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        setStatusMessage({
          type: "error",
          message: `Failed to copy ${label}.`,
        });
      });
  };

  const handleFilterChange = (newFilter) => {
    setFilterBy(newFilter);
  };

  // Create a method to generate etherscan URL for token
  const getEtherscanUrl = (address) => {
    return `https://etherscan.io/token/${address}`;
  };

  return (
    <Container
      maxWidth="md"
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={6}
        sx={{
          p: { xs: 2, sm: 4 },
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
        <Stack spacing={3}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              pb: 2,
            }}>
            <Box
              sx={{
                p: 1.5,
                background: (theme) => alpha(theme.palette.primary.main, 0.1),
                borderRadius: "12px",
                mr: 2,
              }}>
              <TokenIcon color="primary" sx={{ fontSize: 32 }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                background: (theme) =>
                  `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Manage Tokens
            </Typography>
          </Box>

          {/* Status Message */}
          <AnimatePresence mode="wait">
            {statusMessage.message && (
              <motion.div
                key={statusMessage.message}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}>
                <Alert
                  severity={statusMessage.type || "info"}
                  variant="filled"
                  sx={{
                    wordBreak: "break-word",
                    borderRadius: 2,
                    boxShadow: 2,
                  }}>
                  {statusMessage.message}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Token Form */}
          <Card
            elevation={2}
            sx={{
              borderRadius: 2,
              background: (theme) => alpha(theme.palette.background.paper, 0.5),
              backdropFilter: "blur(10px)",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                }}>
                <AddCircleIcon sx={{ mr: 1 }} /> Add New Token
              </Typography>
              <Box component="form" onSubmit={handleAddToken} noValidate>
                <TextField
                  required
                  fullWidth
                  id="newTokenAddress"
                  label="Token Contract Address"
                  name="newTokenAddress"
                  placeholder="0x..."
                  value={newTokenAddress}
                  onChange={(e) => setNewTokenAddress(e.target.value)}
                  disabled={!user || isAdding}
                  variant="outlined"
                  size="medium"
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TokenIcon color="primary" sx={{ opacity: 0.7 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!user || isAdding || !newTokenAddress.trim()}
                  fullWidth
                  sx={{
                    py: 1.2,
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
                  {isAdding ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Adding Token...
                    </Box>
                  ) : (
                    <>
                      <AddCircleIcon sx={{ mr: 1 }} /> Add Token
                    </>
                  )}
                </Button>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}>
                  Enter the contract address of the ERC-20 token you want to
                  add.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}>
            <TextField
              fullWidth
              placeholder="Search tokens by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="medium"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="All Tokens">
                <Button
                  variant={filterBy === "all" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => handleFilterChange("all")}
                  size="medium"
                  sx={{
                    minWidth: "80px",
                    borderRadius: 1.5,
                    textTransform: "none",
                  }}>
                  All
                </Button>
              </Tooltip>

              <Tooltip title="Active Tokens">
                <Button
                  variant={filterBy === "active" ? "contained" : "outlined"}
                  color="success"
                  onClick={() => handleFilterChange("active")}
                  size="medium"
                  sx={{
                    minWidth: "80px",
                    borderRadius: 1.5,
                    textTransform: "none",
                  }}>
                  Active
                </Button>
              </Tooltip>

              <Tooltip title="Inactive Tokens">
                <Button
                  variant={filterBy === "inactive" ? "contained" : "outlined"}
                  color="secondary"
                  onClick={() => handleFilterChange("inactive")}
                  size="medium"
                  sx={{
                    minWidth: "80px",
                    borderRadius: 1.5,
                    textTransform: "none",
                  }}>
                  Inactive
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Tokens List */}
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                Your Tokens
                <Chip
                  label={filteredTokens.length}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${tokens.filter((t) => t.isActive).length} Active`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<ErrorOutlineIcon />}
                  label={`${tokens.filter((t) => !t.isActive).length} Inactive`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Typography>

            {filteredTokens.length === 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: "center",
                  bgcolor: "background.default",
                  borderRadius: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                }}>
                <Typography color="textSecondary">
                  {tokens.length === 0
                    ? "No tokens added yet. Add your first token above."
                    : "No tokens match your search or filter criteria."}
                </Typography>
              </Paper>
            )}

            <AnimatePresence>
              <Grid container spacing={2}>
                {filteredTokens.map((token, index) => (
                  <Grid item xs={12} key={token._id}>
                    <motion.div
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={index}
                      layout>
                      <Card
                        elevation={1}
                        sx={{
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          border: `1px solid ${
                            token.isActive
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.divider, 0.8)
                          }`,
                          "&:hover": {
                            boxShadow: 3,
                            transform: "translateY(-2px)",
                          },
                        }}>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: "50%",
                                  bgcolor: token.isActive
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : alpha(theme.palette.grey[500], 0.1),
                                  display: "flex",
                                  mr: 2,
                                }}>
                                <TokenIcon
                                  color={token.isActive ? "success" : "action"}
                                  fontSize="large"
                                />
                              </Box>

                              <Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}>
                                  <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{ fontWeight: 600 }}>
                                    {token.symbol}
                                  </Typography>

                                  {token.isActive && (
                                    <Tooltip title="Active Token">
                                      <VerifiedIcon
                                        color="success"
                                        sx={{ ml: 1, fontSize: 20 }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>

                                <Typography
                                  variant="body2"
                                  color="textSecondary">
                                  {token.name}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mt: 1,
                                  }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontFamily: "monospace",
                                      bgcolor: "background.default",
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      maxWidth: "200px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}>
                                    {token.address}
                                  </Typography>

                                  <Tooltip title="Copy address">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleCopy(token.address, "Address")
                                      }
                                      sx={{ ml: 0.5 }}>
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="View on Etherscan">
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={getEtherscanUrl(token.address)}
                                      target="_blank"
                                      rel="noopener noreferrer">
                                      <LaunchIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>

                            {!token.isActive && (
                              <Button
                                variant="outlined"
                                color="success"
                                onClick={() => handleActivate(token._id)}
                                sx={{
                                  borderRadius: 4,
                                  textTransform: "none",
                                  fontWeight: 600,
                                }}
                                startIcon={<CheckCircleIcon />}>
                                Activate
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </AnimatePresence>
          </Box>

          {/* Back to Home Button */}
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/")}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 1.5,
                textTransform: "none",
                py: 1.2,
                px: 4,
                fontWeight: 500,
              }}>
              Back to Dashboard
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default TokensPage;
