import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, TextField, MenuItem, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, LinearProgress,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Add as AddIcon, Factory as FactoryIcon, Warning as WarningIcon, CheckCircle as CheckIcon, Error as ErrorIcon } from "@mui/icons-material";
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

export default function Emissions() {
  const [emissions, setEmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [byPollutant, setByPollutant] = useState([]);
  const [facility, setFacility] = useState("all");
  const [pollutant, setPollutant] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newEmission, setNewEmission] = useState({
    facility: "", pollutant: "", concentration: "", limitValue: "",
  });

  useEffect(() => { fetchEmissions(); fetchStats(); }, []);

  const fetchEmissions = async () => {
    try {
      const res = await api.get("/api/emissions");
      setEmissions(res.data.data || []);
    } catch (err) { console.error("Failed to fetch emissions:", err); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/emissions/stats");
      setStats(res.data.stats || {});
      setByPollutant(res.data.byPollutant || []);
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const handleAdd = async () => {
    try {
      await api.post("/api/emissions", {
        ...newEmission,
        concentration: parseFloat(newEmission.concentration),
        limitValue: parseFloat(newEmission.limitValue),
        unit: "mg/Nm3",
        stackHeight: 20,
        flowRate: 1000,
        temperature: 150,
        recordedAt: new Date().toISOString(),
      });
      setOpen(false);
      setNewEmission({ facility: "", pollutant: "", concentration: "", limitValue: "" });
      fetchEmissions();
      fetchStats();
    } catch (err) { console.error("Failed to add emission:", err); }
  };

  const getStatusLabel = (row) => {
    if (row.status) return row.status;
    const ratio = row.limitValue > 0 ? (row.concentration / row.limitValue) * 100 : 0;
    if (ratio > 100) return "Violation";
    if (ratio > 80) return "Warning";
    return "Compliant";
  };

  const filtered = emissions.filter((e) => {
    if (facility !== "all" && !e.facility?.includes(facility)) return false;
    if (pollutant !== "all" && e.pollutant !== pollutant) return false;
    if (statusFilter !== "all" && getStatusLabel(e) !== statusFilter) return false;
    return true;
  });

  const chartData = byPollutant.map((p) => ({ name: p._id, avg: Math.round(p.avgConcentration), count: p.count }));
  const pieData = [
    { name: "Compliant", value: stats?.compliant || 0 },
    { name: "Warning", value: stats?.warning || 0 },
    { name: "Violation", value: stats?.violation || 0 },
  ].filter(d => d.value > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Stack Emissions Monitoring</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2 }}>Add Emission</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Recordings" value={stats?.total || 0} icon={<FactoryIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Compliant" value={stats?.compliant || 0} icon={<CheckIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Warning" value={stats?.warning || 0} icon={<WarningIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Violation" value={stats?.violation || 0} icon={<ErrorIcon />} color="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth select label="Facility" value={facility} onChange={(e) => setFacility(e.target.value)} size="small">
            <MenuItem value="all">All Facilities</MenuItem>
            <MenuItem value="Main Factory">Plant A - Main Factory</MenuItem>
            <MenuItem value="Assembly Unit">Plant B - Assembly Unit</MenuItem>
            <MenuItem value="Foundry">Plant C - Foundry</MenuItem>
            <MenuItem value="Coating Facility">Plant D - Coating Facility</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth select label="Pollutant" value={pollutant} onChange={(e) => setPollutant(e.target.value)} size="small">
            <MenuItem value="all">All Pollutants</MenuItem>
            <MenuItem value="SO2">SO₂</MenuItem>
            <MenuItem value="NOx">NOₓ</MenuItem>
            <MenuItem value="CO">CO</MenuItem>
            <MenuItem value="PM">PM</MenuItem>
            <MenuItem value="VOC">VOC</MenuItem>
            <MenuItem value="HCl">HCl</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small">
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Compliant">Compliant</MenuItem>
            <MenuItem value="Warning">Warning</MenuItem>
            <MenuItem value="Violation">Violation</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Facility</TableCell>
              <TableCell>Stack ID</TableCell>
              <TableCell>Pollutant</TableCell>
              <TableCell>Concentration</TableCell>
              <TableCell>Limit</TableCell>
              <TableCell>Ratio</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const ratio = row.limitValue > 0 ? (row.concentration / row.limitValue) * 100 : 0;
              const statusLabel = getStatusLabel(row);
              return (
                <TableRow key={row._id}>
                  <TableCell>{row.facility}</TableCell>
                  <TableCell>{row.stackId}</TableCell>
                  <TableCell>{row.pollutant}</TableCell>
                  <TableCell>{row.concentration?.toFixed(2)}</TableCell>
                  <TableCell>{row.limitValue?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress variant="determinate" value={Math.min(ratio, 100)} sx={{
                        flexGrow: 1, height: 8, borderRadius: 4,
                        "& .MuiLinearProgress-bar": { backgroundColor: ratio > 100 ? "#d32f2f" : ratio > 80 ? "#ed6c02" : "#2e7d32" },
                      }} />
                      <Typography variant="body2" sx={{ minWidth: 40 }}>{ratio.toFixed(0)}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabel} color={statusLabel === "Compliant" ? "success" : statusLabel === "Warning" ? "warning" : "error"} size="small" />
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
            <Typography variant="h6" sx={{ mb: 2 }}>Pollutant Concentrations</Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#1976d2" name="Avg Concentration" radius={[4, 4, 0, 0]} />
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
            <Typography variant="h6" sx={{ mb: 2 }}>Compliance Distribution</Typography>
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
        <DialogTitle>Add New Emission Record</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Facility" value={newEmission.facility} onChange={(e) => setNewEmission({ ...newEmission, facility: e.target.value })}>
                <MenuItem value="Plant A - Main Factory">Plant A - Main Factory</MenuItem>
                <MenuItem value="Plant B - Assembly Unit">Plant B - Assembly Unit</MenuItem>
                <MenuItem value="Plant C - Foundry">Plant C - Foundry</MenuItem>
                <MenuItem value="Plant D - Coating Facility">Plant D - Coating Facility</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Pollutant" value={newEmission.pollutant} onChange={(e) => setNewEmission({ ...newEmission, pollutant: e.target.value })}>
                <MenuItem value="SO2">SO₂</MenuItem>
                <MenuItem value="NOx">NOₓ</MenuItem>
                <MenuItem value="CO">CO</MenuItem>
                <MenuItem value="PM">PM</MenuItem>
                <MenuItem value="VOC">VOC</MenuItem>
                <MenuItem value="HCl">HCl</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Concentration" type="number" value={newEmission.concentration} onChange={(e) => setNewEmission({ ...newEmission, concentration: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Limit Value" type="number" value={newEmission.limitValue} onChange={(e) => setNewEmission({ ...newEmission, limitValue: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
