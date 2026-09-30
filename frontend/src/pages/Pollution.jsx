import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, TextField, MenuItem, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Add as AddIcon, WaterDrop as WaterIcon, CheckCircle as CheckIcon, Warning as WarningIcon, Error as ErrorIcon } from "@mui/icons-material";
import api from "../api/axios";

const COLORS = ["#2e7d32", "#ed6c02", "#d32f2f"];

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
    </CardContent>
  </Card>
);

export default function Pollution() {
  const [readings, setReadings] = useState([]);
  const [stats, setStats] = useState(null);
  const [byType, setByType] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newReading, setNewReading] = useState({
    facility: "", type: "air", parameter: "", value: "", standardLimit: "", unit: "µg/m³",
  });

  useEffect(() => { fetchReadings(); fetchStats(); }, []);

  const fetchReadings = async () => {
    try {
      const res = await api.get("/api/pollutions");
      setReadings(res.data.data || []);
    } catch (err) { console.error("Failed to fetch pollutions:", err); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/pollutions/stats");
      setStats(res.data.stats || {});
      setByType(res.data.byType || []);
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const getSeverity = (row) => {
    if (row.standardLimit && row.value) {
      const ratio = row.value / row.standardLimit;
      if (ratio > 1.5) return "Critical";
      if (ratio > 1) return "Moderate";
    }
    return "Safe";
  };

  const handleAdd = async () => {
    try {
      await api.post("/api/pollutions", {
        ...newReading,
        facility: newReading.facility || "Plant A - Main Factory",
        value: parseFloat(newReading.value),
        standardLimit: parseFloat(newReading.standardLimit),
        location: "Zone A",
        source: "Manual Entry",
        recordedAt: new Date().toISOString(),
      });
      setOpen(false);
      setNewReading({ facility: "", type: "air", parameter: "", value: "", standardLimit: "", unit: "µg/m³" });
      fetchReadings();
      fetchStats();
    } catch (err) { console.error("Failed to add reading:", err); }
  };

  const filtered = readings.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && getSeverity(r) !== statusFilter) return false;
    return true;
  });

  const chartData = byType.map((t) => ({ name: t._id, avg: Math.round(t.avgValue), count: t.count }));
  const pieData = [
    { name: "Safe", value: stats?.safe || 0 },
    { name: "Moderate", value: stats?.moderate || 0 },
    { name: "Critical", value: stats?.critical || 0 },
  ].filter(d => d.value > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Pollution Levels</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2 }}>Add Reading</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Readings" value={stats?.total || 0} icon={<WaterIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Safe" value={stats?.safe || 0} icon={<CheckIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Moderate" value={stats?.moderate || 0} icon={<WarningIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Critical" value={stats?.critical || 0} icon={<ErrorIcon />} color="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} size="small">
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="air">Air</MenuItem>
            <MenuItem value="water">Water</MenuItem>
            <MenuItem value="noise">Noise</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small">
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Safe">Safe</MenuItem>
            <MenuItem value="Moderate">Moderate</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Facility</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Parameter</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Limit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const severity = getSeverity(row);
              return (
                <TableRow key={row._id}>
                  <TableCell>{row.facility}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.type}</TableCell>
                  <TableCell>{row.parameter}</TableCell>
                  <TableCell>{row.value?.toFixed(2)}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.standardLimit}</TableCell>
                  <TableCell>
                    <Chip label={severity} color={severity === "Safe" ? "success" : severity === "Moderate" ? "warning" : "error"} size="small" />
                  </TableCell>
                  <TableCell>{new Date(row.recordedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Type Comparison</Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#1976d2" name="Avg Value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No chart data</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Status Distribution</Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No chart data</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Pollution Reading</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Facility" value={newReading.facility} onChange={(e) => setNewReading({ ...newReading, facility: e.target.value })}>
                <MenuItem value="Plant A - Main Factory">Plant A - Main Factory</MenuItem>
                <MenuItem value="Plant B - Assembly Unit">Plant B - Assembly Unit</MenuItem>
                <MenuItem value="Plant C - Foundry">Plant C - Foundry</MenuItem>
                <MenuItem value="Plant D - Coating Facility">Plant D - Coating Facility</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth select label="Type" value={newReading.type} onChange={(e) => setNewReading({ ...newReading, type: e.target.value })}>
                <MenuItem value="air">Air</MenuItem>
                <MenuItem value="water">Water</MenuItem>
                <MenuItem value="noise">Noise</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Parameter" value={newReading.parameter} onChange={(e) => setNewReading({ ...newReading, parameter: e.target.value })} placeholder="e.g., PM2.5" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField fullWidth label="Value" type="number" value={newReading.value} onChange={(e) => setNewReading({ ...newReading, value: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField fullWidth label="Limit" type="number" value={newReading.standardLimit} onChange={(e) => setNewReading({ ...newReading, standardLimit: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField fullWidth label="Unit" value={newReading.unit} onChange={(e) => setNewReading({ ...newReading, unit: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Reading</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
