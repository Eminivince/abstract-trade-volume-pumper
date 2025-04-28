// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AnimatePresence } from "framer-motion";
import CssBaseline from "@mui/material/CssBaseline";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#f48fb1",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AnimatePresence mode="wait">
          <App />
        </AnimatePresence>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
