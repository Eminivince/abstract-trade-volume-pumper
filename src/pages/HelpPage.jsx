// frontend/src/pages/HelpPage.js
import React from "react";
import { useNavigate } from "react-router-dom";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function HelpPage() {
  const navigate = useNavigate();

  const helpTopics = [
    "Create a wallet group to manage multiple wallets at once.",
    "Distribute ETH to all wallets from the first wallet in the group.",
    "Select a token to buy/sell/burn across all wallets.",
    "Collect funds from all wallets back to the first wallet.",
    "Generate usage reports for a date range (PDF).",
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <HelpOutlineIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
          <Typography component="h1" variant="h5">
            Help
          </Typography>
        </Box>

        <List>
          {helpTopics.map((topic, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <HelpOutlineIcon color="action" />
              </ListItemIcon>
              <ListItemText primary={topic} />
            </ListItem>
          ))}
        </List>

        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default HelpPage;
