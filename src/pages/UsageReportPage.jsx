// frontend/src/pages/UsageReportPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { generateUsageReport } from "../api/usageReport";
import { useAuth } from "../context/AuthContext"; // Import AuthContext
import DatePicker from "react-datepicker"; // Optional: For better date inputs
import "react-datepicker/dist/react-datepicker.css";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress,
  TextField
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function UsageReportPage() {
  const [fromDate, setFromDate] = useState(null); // Using Date objects
  const [toDate, setToDate] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user, token } = useAuth(); // Get user and token from AuthContext

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      setStatus({
        type: "error",
        message: "Please select both From Date and To Date.",
      });
      return;
    }

    // Ensure fromDate is before toDate
    if (fromDate > toDate) {
      setStatus({
        type: "error",
        message: "From Date cannot be after To Date.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });
    setPdfUrl(null); // Reset previous PDF

    try {
      // Format dates as YYYY-MM-DD
      const formattedFromDate = fromDate.toISOString().split("T")[0];
      const formattedToDate = toDate.toISOString().split("T")[0];

      const arrayBuffer = await generateUsageReport(
        user.chatId,
        formattedFromDate,
        formattedToDate,
        user._id
      );

      // Convert arrayBuffer to a Blob
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus({ type: "success", message: "Report generated successfully." });
    } catch (err) {
      console.error("Error generating report:", err);
      // Handle error messages from backend
      if (err.response && err.response.data && err.response.data.error) {
        setStatus({
          type: "error",
          message: `Error: ${err.response.data.error}`,
        });
      } else {
        setStatus({ type: "error", message: "Error generating report." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, prompt to log in
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Usage Report
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please log in to generate your usage report.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}
            startIcon={<ArrowBackIcon />}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <PictureAsPdfIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
          <Typography variant="h5" component="h2">
            Usage Report
          </Typography>
        </Box>

        {status.message && (
          <Alert severity={status.type} sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {status.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleGenerate} noValidate>
          <Box display="flex" flexDirection="column" mb={2}>
            <Typography variant="subtitle1">From Date:</Typography>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
              placeholderText="Select start date"
              isClearable
              required
              customInput={<TextField />}
              wrapperClassName="datePicker"
            />
          </Box>
          <Box display="flex" flexDirection="column" mb={2}>
            <Typography variant="subtitle1">To Date:</Typography>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
              placeholderText="Select end date"
              isClearable
              required
              customInput={<TextField />}
              wrapperClassName="datePicker"
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
            sx={{ mt: 2, mb: 2 }}>
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </Box>

        {pdfUrl && (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" gutterBottom>
              Report generated:
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mr: 2 }}
              startIcon={<PictureAsPdfIcon />}>
              View PDF
            </Button>
            <Button
              variant="contained"
              color="secondary"
              href={pdfUrl}
              download={`UsageReport_${fromDate.toISOString().split("T")[0]}_${
                toDate.toISOString().split("T")[0]
              }.pdf`}
              startIcon={<PictureAsPdfIcon />}>
              Download PDF
            </Button>
          </Box>
        )}

        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/")}
            startIcon={<ArrowBackIcon />}>
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default UsageReportPage;
