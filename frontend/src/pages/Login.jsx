import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Science } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #F57C00 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%", p: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Science sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>
              EcoComply
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manufacturing Environmental Compliance System
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              slotProps={{
                input: { autoComplete: "email" },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  autoComplete: "current-password",
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            Don't have an account?{" "}
            <RouterLink to="/register" style={{ color: "inherit", fontWeight: 600 }}>
              Register here
            </RouterLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
