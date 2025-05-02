// frontend/src/pages/CollectFundsPage.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { collectFunds } from "../api/transactions";
import { useAuth } from "../context/AuthContext";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack,
  Tooltip,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

function CollectFundsPage() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectStats, setCollectStats] = useState({
    successCount: 0,
    failCount: 0,
    totalCollected: 0,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const handleCollect = async () => {
    if (!user) {
      setResult("Please log in to collect funds.");
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const resp = await collectFunds(user.chatId);

      setCollectStats({
        successCount: resp.result.successCount,
        failCount: resp.result.failCount,
        totalCollected: resp.result.totalCollected,
      });

      setResult(
        `Funds collected successfully! ${resp.result.successCount} wallets processed, ${resp.result.totalCollected} ETH collected.`
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
      <Container
        maxWidth="sm"
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ mt: 8 }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            textAlign: "center",
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
                width: "fit-content",
                margin: "0 auto",
                mb: 2,
              }}>
              <MonetizationOnIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={1}
            initial="hidden"
            animate="visible">
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Collect Funds
            </Typography>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={2}
            initial="hidden"
            animate="visible">
            <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
              Please log in to collect funds.
            </Typography>
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={3}
            initial="hidden"
            animate="visible">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/login")}
              startIcon={<MonetizationOnIcon />}
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
              Go to Login
            </Button>
          </motion.div>
        </Paper>
      </Container>
    );
  }

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
          p: 4,
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
              <MonetizationOnIcon color="primary" sx={{ fontSize: 32 }} />
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
              Collect Funds
            </Typography>
          </Box>

          {/* Description */}
          <Card
            elevation={0}
            sx={{
              bgcolor: "background.default",
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                <InfoIcon color="info" sx={{ mr: 1, mt: 0.3 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  What does this do?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                This function will scan all wallets in your active wallet group
                and collect available ETH funds back to your main wallet.
              </Typography>

              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Tooltip title="All ETH will be withdrawn">
                  <Chip
                    icon={<AccountBalanceWalletIcon fontSize="small" />}
                    label="ETH Only"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title="Tokens are not collected">
                  <Chip
                    icon={<InfoIcon fontSize="small" />}
                    label="Excludes Tokens"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}>
                <Alert
                  severity={
                    result.startsWith("Funds collected") ? "success" : "error"
                  }
                  variant="filled"
                  sx={{
                    mb: 2,
                    whiteSpace: "pre-wrap",
                    borderRadius: 1,
                  }}>
                  {result}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          {(collectStats.successCount > 0 || collectStats.failCount > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}>
              <Card
                elevation={1}
                sx={{
                  borderRadius: 2,
                  background: (theme) =>
                    alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ mb: 2 }}>
                    Collection Summary
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "center",
                    }}>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}>
                        <CheckCircleIcon color="success" />
                        <Typography
                          variant="h5"
                          color="success.main"
                          fontWeight={600}>
                          {collectStats.successCount}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Successful
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem />

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}>
                        <ErrorOutlineIcon color="error" />
                        <Typography
                          variant="h5"
                          color="error.main"
                          fontWeight={600}>
                          {collectStats.failCount}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem />

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}>
                        <MonetizationOnIcon color="primary" />
                        <Typography
                          variant="h5"
                          color="primary.main"
                          fontWeight={600}>
                          {collectStats.totalCollected}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        ETH Collected
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCollect}
                disabled={isLoading}
                fullWidth
                sx={{
                  py: 1.5,
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
                    Collecting Funds...
                  </Box>
                ) : (
                  <>
                    <MonetizationOnIcon sx={{ mr: 1 }} />
                    Collect All ETH
                  </>
                )}
              </Button>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/")}
                startIcon={<ArrowBackIcon />}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 1.5,
                  textTransform: "none",
                }}>
                Back
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
}

export default CollectFundsPage;
