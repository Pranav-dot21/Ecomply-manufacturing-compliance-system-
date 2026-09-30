import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, TextField, MenuItem, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import {
  Add as AddIcon, Delete as DeleteIcon, Description as ReportIcon,
  Send as SubmitIcon, CheckCircle as ApprovedIcon, Edit as DraftIcon, Visibility as ViewIcon,
} from "@mui/icons-material";
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

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    title: "", regulatoryBody: "", type: "annual-compliance",
    facility: "", dueDate: "", status: "draft", priority: "medium",
  });

  useEffect(() => { fetchReports(); fetchStats(); }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/api/reports");
      setReports(res.data.data || []);
    } catch (err) { console.error("Failed to fetch reports:", err); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/reports/stats");
      setStats(res.data.stats || {});
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const handleAdd = async () => {
    try {
      await api.post("/api/reports", {
        ...form,
        summary: `Report for ${form.facility}`,
        keyFindings: ["Under review"],
        recommendations: ["Continue monitoring"],
        reportingPeriod: { from: new Date(), to: form.dueDate ? new Date(form.dueDate) : new Date() },
      });
      setOpen(false);
      fetchReports();
      fetchStats();
    } catch (err) { console.error("Failed to create report:", err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/api/reports/${id}`);
      fetchReports();
      fetchStats();
    } catch (err) { console.error("Failed to delete report:", err); }
  };

  const filtered = reports.filter((r) => statusFilter !== "all" ? r.status === statusFilter : true);

  const fmt = (s) => s?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "—";
  const statusColor = (s) => ({ approved: "success", submitted: "info", "under-review": "warning", draft: "default", rejected: "error", overdue: "error" }[s] || "default");

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Statutory Reports</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2 }}>Create Report</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Reports" value={stats?.total || 0} icon={<ReportIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Draft" value={stats?.draft || 0} icon={<DraftIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Submitted" value={stats?.submitted || 0} icon={<SubmitIcon />} color="#0288d1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Approved" value={stats?.approved || 0} icon={<ApprovedIcon />} color="#2e7d32" />
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <TextField select label="Filter by Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small" sx={{ minWidth: 200 }}>
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="under-review">Under Review</MenuItem>
          <MenuItem value="submitted">Submitted</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
          <MenuItem value="overdue">Overdue</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Regulatory Body</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Facility</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const overdue = row.status === "overdue" || (row.dueDate && new Date(row.dueDate) < new Date() && row.status !== "approved");
              return (
                <TableRow key={row._id} hover sx={overdue ? { backgroundColor: "rgba(211,47,47,0.08)" } : {}}>
                  <TableCell sx={{ cursor: "pointer" }} onClick={() => { setSelected(row); setDetailOpen(true); }}>{row.title}</TableCell>
                  <TableCell><Chip label={row.regulatoryBody} size="small" variant="outlined" /></TableCell>
                  <TableCell>{fmt(row.type)}</TableCell>
                  <TableCell>{row.facility}</TableCell>
                  <TableCell sx={overdue ? { color: "error.main", fontWeight: 600 } : {}}>
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell><Chip label={fmt(row.status)} color={statusColor(row.status)} size="small" /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setSelected(row); setDetailOpen(true); }}><ViewIcon fontSize="small" /></IconButton>
                    <IconButton color="error" size="small" onClick={() => handleDelete(row._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Report</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Regulatory Body" value={form.regulatoryBody} onChange={(e) => setForm({ ...form, regulatoryBody: e.target.value })} placeholder="e.g., CPCB, SPCB, MoEFCC" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Report Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="annual-compliance">Annual Compliance</MenuItem>
                <MenuItem value="quarterly-submission">Quarterly Submission</MenuItem>
                <MenuItem value="self-monitoring">Self Monitoring</MenuItem>
                <MenuItem value="incident">Incident Report</MenuItem>
                <MenuItem value="consent-renewal">Consent Renewal</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Facility" value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })}>
                <MenuItem value="Plant A - Main Factory">Plant A - Main Factory</MenuItem>
                <MenuItem value="Plant B - Assembly Unit">Plant B - Assembly Unit</MenuItem>
                <MenuItem value="Plant C - Foundry">Plant C - Foundry</MenuItem>
                <MenuItem value="Plant D - Coating Facility">Plant D - Coating Facility</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="under-review">Under Review</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.title}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" color="text.secondary">Regulatory Body</Typography><Chip label={selected.regulatoryBody} sx={{ mt: 0.5 }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" color="text.secondary">Report Type</Typography><Typography>{fmt(selected.type)}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" color="text.secondary">Facility</Typography><Typography>{selected.facility}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" color="text.secondary">Due Date</Typography><Typography>{selected.dueDate ? new Date(selected.dueDate).toLocaleDateString() : "N/A"}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" color="text.secondary">Status</Typography><Chip label={fmt(selected.status)} color={statusColor(selected.status)} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" color="text.secondary">Consent Number</Typography><Typography>{selected.consentNumber || "N/A"}</Typography></Grid>
                {selected.summary && <Grid size={{ xs: 12 }}><Typography variant="subtitle2" color="text.secondary">Summary</Typography><Typography>{selected.summary}</Typography></Grid>}
                {selected.keyFindings?.length > 0 && <Grid size={{ xs: 12 }}><Typography variant="subtitle2" color="text.secondary">Key Findings</Typography>{selected.keyFindings.map((f, i) => <Typography key={i} variant="body2">• {f}</Typography>)}</Grid>}
                {selected.recommendations?.length > 0 && <Grid size={{ xs: 12 }}><Typography variant="subtitle2" color="text.secondary">Recommendations</Typography>{selected.recommendations.map((r, i) => <Typography key={i} variant="body2">• {r}</Typography>)}</Grid>}
              </Grid>
            </DialogContent>
            <DialogActions><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
