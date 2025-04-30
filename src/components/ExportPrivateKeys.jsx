import { useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CryptoJS from "crypto-js";

const ExportPrivateKeys = ({ wallets, groupName }) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleExportOpen = () => setExportDialogOpen(true);
  const handleExportClose = () => {
    setExportDialogOpen(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleImportOpen = () => setImportDialogOpen(true);
  const handleImportClose = () => {
    setImportDialogOpen(false);
    setPassword("");
    setSelectedFile(null);
    setError("");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleExport = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      // Prepare the data to encrypt
      const data = {
        groupName,
        wallets: wallets.map((w) => ({
          address: w.address,
          privateKey: w.privateKey,
        })),
        exportDate: new Date().toISOString(),
      };

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        password
      ).toString();

      // Create and download the file
      const blob = new Blob([encrypted], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${groupName.replace(/\s+/g, "_")}_private_keys_${
        new Date().toISOString().split("T")[0]
      }.enc`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      handleExportClose();
    } catch (err) {
      setError("Failed to export private keys: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedFile) {
      setError("Please select a file to decrypt");
      return;
    }
    if (!password) {
      setError("Please enter the decryption password");
      return;
    }

    setLoading(true);
    try {
      const fileContent = await selectedFile.text();

      // Try to decrypt the file
      const decrypted = CryptoJS.AES.decrypt(fileContent, password);
      const decryptedData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

      // Validate the decrypted data structure
      if (!decryptedData.wallets || !Array.isArray(decryptedData.wallets)) {
        throw new Error("Invalid file format");
      }

      // Create a formatted text content
      const textContent = [
        `Wallet Group: ${decryptedData.groupName}`,
        `Export Date: ${new Date(decryptedData.exportDate).toLocaleString()}`,
        "\nWallet Details:",
        ...decryptedData.wallets.map(
          (w, i) =>
            `\nWallet #${i + 1}:\nAddress: ${w.address}\nPrivate Key: ${
              w.privateKey
            }`
        ),
      ].join("\n");

      // Download as text file
      const blob = new Blob([textContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decrypted_private_keys_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      handleImportClose();
    } catch (err) {
      setError(
        "Failed to decrypt file. Please check your password and file format."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<FileDownloadIcon />}
        onClick={handleExportOpen}>
        Encrypt & Export Private Keys
      </Button>

      <Button
        variant="outlined"
        color="primary"
        startIcon={<FileUploadIcon />}
        onClick={handleImportOpen}>
        Import & Decrypt Keys
      </Button>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={handleExportClose}>
        <DialogTitle>Encrypt and Export Private Keys</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Encryption Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExportClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
            variant="contained"
            color="primary">
            {loading ? "Exporting..." : "Export Encrypted File"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleImportClose}>
        <DialogTitle>Import & Decrypt Keys</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mb: 2 }}>
            <input
              accept=".enc"
              style={{ display: "none" }}
              id="raised-button-file"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="raised-button-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<FileUploadIcon />}
                disabled={loading}
                fullWidth>
                {selectedFile ? selectedFile.name : "Choose Encrypted File"}
              </Button>
            </label>
          </Box>
          <TextField
            margin="dense"
            label="Decryption Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDecrypt}
            disabled={loading || !selectedFile}
            startIcon={
              loading ? <CircularProgress size={20} /> : <LockOpenIcon />
            }
            variant="contained"
            color="primary">
            {loading ? "Decrypting..." : "Decrypt & Download"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ExportPrivateKeys.propTypes = {
  wallets: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string.isRequired,
      privateKey: PropTypes.string.isRequired,
    })
  ).isRequired,
  groupName: PropTypes.string.isRequired,
};

export default ExportPrivateKeys;
