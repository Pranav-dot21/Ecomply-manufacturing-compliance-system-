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
  MenuItem,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Science } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "officer" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
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
              Create your account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  autoComplete: "new-password",
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
            <TextField
              fullWidth
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              sx={{ mb: 3 }}
            >
              <MenuItem value="officer">Environment Officer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="management">Management</MenuItem>
            </TextField>
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            Already have an account?{" "}
            <RouterLink to="/login" style={{ color: "inherit", fontWeight: 600 }}>
              Sign in
            </RouterLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
