import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, TextField, MenuItem, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import {
  Add as AddIcon, ViewList as ListIcon, ViewModule as GridIcon,
  Assignment as InspectionIcon, Schedule as PendingIcon,
  Autorenew as InProgressIcon, CheckCircle as CompletedIcon, Warning as OverdueIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import api from "../api/axios";

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

export default function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("table");
  const [open, setOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(dayjs());
  const [form, setForm] = useState({
    facility: "", type: "scheduled", category: "air-quality",
    inspector: "", description: "", priority: "medium",
  });

  useEffect(() => { fetchInspections(); fetchStats(); }, []);

  const fetchInspections = async () => {
    try {
      const res = await api.get("/api/inspections");
      setInspections(res.data.data || []);
    } catch (err) { console.error("Failed to fetch inspections:", err); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/inspections/stats");
      setStats(res.data.stats || {});
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const handleAdd = async () => {
    try {
      await api.post("/api/inspections", {
        ...form,
        scheduledDate: scheduledDate.toISOString(),
        status: "pending",
      });
      setOpen(false);
      setForm({ facility: "", type: "scheduled", category: "air-quality", inspector: "", description: "", priority: "medium" });
      fetchInspections();
      fetchStats();
    } catch (err) { console.error("Failed to add inspection:", err); }
  };

  const filtered = inspections.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const fmt = (s) => s?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "—";
  const statusColor = (s) => ({ completed: "success", "in-progress": "info", overdue: "error", pending: "warning", "requires-follow-up": "secondary" }[s] || "default");
  const priorityColor = (p) => ({ critical: "error", high: "warning", medium: "info", low: "success" }[p] || "default");

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Inspections</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
            <ToggleButton value="table"><ListIcon /></ToggleButton>
            <ToggleButton value="card"><GridIcon /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2 }}>Schedule Inspection</Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard title="Total" value={stats?.total || 0} icon={<InspectionIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard title="Pending" value={stats?.pending || 0} icon={<PendingIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard title="In Progress" value={stats?.inProgress || 0} icon={<InProgressIcon />} color="#0288d1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard title="Completed" value={stats?.completed || 0} icon={<CompletedIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard title="Overdue" value={stats?.overdue || 0} icon={<OverdueIcon />} color="#d32f2f" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard title="Follow-Up" value={stats?.requiresFollowUp || 0} icon={<InspectionIcon />} color="#7b1fa2" />
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <TextField select label="Filter by Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small" sx={{ minWidth: 200 }}>
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="in-progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="overdue">Overdue</MenuItem>
          <MenuItem value="requires-follow-up">Follow-Up</MenuItem>
        </TextField>
      </Box>

      {view === "table" ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Facility</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell>{row.facility}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.type}</TableCell>
                  <TableCell>{fmt(row.category)}</TableCell>
                  <TableCell>{new Date(row.scheduledDate).toLocaleDateString()}</TableCell>
                  <TableCell><Chip label={fmt(row.priority)} color={priorityColor(row.priority)} size="small" /></TableCell>
                  <TableCell><Chip label={fmt(row.status)} color={statusColor(row.status)} size="small" /></TableCell>
                  <TableCell>{row.complianceScore != null ? `${row.complianceScore}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((row) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={row._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{row.facility}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{fmt(row.type)} — {fmt(row.category)}</Typography>
                  <Typography variant="body2">Date: {new Date(row.scheduledDate).toLocaleDateString()}</Typography>
                  {row.complianceScore != null && <Typography variant="body2">Score: {row.complianceScore}%</Typography>}
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Chip label={fmt(row.priority)} color={priorityColor(row.priority)} size="small" />
                    <Chip label={fmt(row.status)} color={statusColor(row.status)} size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Inspection</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Facility" value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })}>
                <MenuItem value="Plant A - Main Factory">Plant A - Main Factory</MenuItem>
                <MenuItem value="Plant B - Assembly Unit">Plant B - Assembly Unit</MenuItem>
                <MenuItem value="Plant C - Foundry">Plant C - Foundry</MenuItem>
                <MenuItem value="Plant D - Coating Facility">Plant D - Coating Facility</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="random">Random</MenuItem>
                <MenuItem value="follow-up">Follow-Up</MenuItem>
                <MenuItem value="complaint-based">Complaint-Based</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="air-quality">Air Quality</MenuItem>
                <MenuItem value="water-discharge">Water Discharge</MenuItem>
                <MenuItem value="waste-management">Waste Management</MenuItem>
                <MenuItem value="noise">Noise</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="documentation">Documentation</MenuItem>
                <MenuItem value="safety">Safety</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Inspector" value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker label="Scheduled Date" value={scheduledDate} onChange={(v) => setScheduledDate(v)} slotProps={{ textField: { fullWidth: true } }} />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
