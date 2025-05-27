import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function AuthorizationManager() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authorization_token");
    if (token) {
      setIsAuthorized(true);
    }
  }, []);

  const handleGenerateToken = () => {
    if (!username || !password) {
      return;
    }

    const token = btoa(`${username}:${password}`);
    localStorage.setItem("authorization_token", token);
    setIsAuthorized(true);
  };

  const handleRemoveToken = () => {
    localStorage.removeItem("authorization_token");
    setIsAuthorized(false);
  };

  return (
    <Box sx={{ mb: 4, p: 2, border: "1px solid #eee", borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Authorization Management
      </Typography>
      {isAuthorized ? (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            You are authorized to use the Import functionality
          </Alert>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleRemoveToken}
          >
            Remove Authorization Token
          </Button>
        </>
      ) : (
        <Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You need to generate an authorization token to use the Import
            functionality
          </Alert>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: "400px",
            }}
          >
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateToken}
              disabled={!username || !password}
            >
              Generate Authorization Token
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
