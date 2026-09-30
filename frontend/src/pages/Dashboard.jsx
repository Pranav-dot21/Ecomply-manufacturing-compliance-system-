import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert,
} from "@mui/material";
import {
  Air,
  Water,
  Assignment,
  Description,
  TrendingUp,
  TrendingDown,
  Schedule,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import api from "../api/axios";

const STATUS_COLORS = {
  compliant: "#2E7D32",
  warning: "#F57C00",
  violation: "#D32F2F",
  safe: "#2E7D32",
  moderate: "#F57C00",
  critical: "#D32F2F",
  pending: "#0277BD",
  "in-progress": "#F57C00",
  completed: "#2E7D32",
  overdue: "#D32F2F",
  draft: "#757575",
  "under-review": "#0277BD",
  submitted: "#F57C00",
  approved: "#2E7D32",
  rejected: "#D32F2F",
};

const PIE_COLORS = ["#2E7D32", "#F57C00", "#D32F2F", "#0277BD", "#757575", "#6A1B9A"];

function StatCard({ icon, title, value, subtitle, color, trend }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={700} color={color || "text.primary"}>{value}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color || "#1B5E20"}15`,
              color: color || "primary.main",
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            {trend >= 0 ? (
              <TrendingUp sx={{ fontSize: 16, color: trend > 0 ? "error.main" : "success.main", mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: "success.main", mr: 0.5 }} />
            )}
            <Typography variant="caption" color={trend > 0 ? "error.main" : "success.main"}>
              {Math.abs(trend)}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const label = status?.replace(/-/g, " ") || "unknown";
  return (
    <Chip
      label={label.charAt(0).toUpperCase() + label.slice(1)}
      size="small"
      sx={{ backgroundColor: STATUS_COLORS[status] || "#757575", color: "white", fontWeight: 500, fontSize: "0.7rem" }}
    />
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/api/dashboard");
        setData(res.data.dashboard);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const emissionChartData = data?.emissionTrend?.map((item) => ({
    month: item._id,
    recordings: item.total,
    violations: item.violations,
  })) || [];

  const pollutionChartData = data?.pollutionTrend?.map((item) => ({
    month: item._id,
    recordings: item.total,
    critical: item.critical,
  })) || [];

  const inspectionPieData = data?.inspectionStats
    ? Object.entries(data.inspectionStats).map(([key, value]) => ({ name: key, value }))
    : [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Dashboard Overview</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Real-time monitoring of environmental compliance across all facilities
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<Air />} title="Stack Emissions" value={data?.counts?.totalEmissions || 0}
            subtitle={`${data?.emissionStats?.violation || 0} violations`} color="#1B5E20" trend={-5} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<Water />} title="Pollution Records" value={data?.counts?.totalPollutions || 0}
            subtitle={`${data?.pollutionStats?.critical || 0} critical`} color="#0277BD" trend={3} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<Assignment />} title="Inspections" value={data?.counts?.totalInspections || 0}
            subtitle={`${data?.inspectionStats?.overdue || 0} overdue`} color="#F57C00" trend={-12} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<Description />} title="Reports" value={data?.counts?.totalReports || 0}
            subtitle={`${data?.reportStats?.overdue || 0} overdue`} color="#6A1B9A" trend={8} />
        </Grid>
      </Grid>

      {/* Compliance Score + Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" gutterBottom>Compliance Score</Typography>
              <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 160, height: 160, my: 2 }}>
                <CircularProgress variant="determinate" value={100} size={160} thickness={5}
                  sx={{ color: "action.hover", position: "absolute" }} />
                <CircularProgress variant="determinate" value={data?.complianceScore || 0} size={160} thickness={5}
                  sx={{
                    color: (data?.complianceScore || 0) >= 80 ? "success.main" : (data?.complianceScore || 0) >= 60 ? "warning.main" : "error.main",
                    position: "absolute",
                  }} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                  <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1 }}>
                    {data?.complianceScore || 0}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {(data?.complianceScore || 0) >= 80 ? "Excellent compliance across facilities"
                  : (data?.complianceScore || 0) >= 60 ? "Moderate compliance — review violations"
                  : "Low compliance — immediate action needed"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Emissions Trend (6 Months)</Typography>
              {emissionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={emissionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="recordings" fill="#2E7D32" name="Total Recordings" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="violations" fill="#D32F2F" name="Violations" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">No emission data yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pollution Levels Trend</Typography>
              {pollutionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={pollutionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="recordings" stroke="#0277BD" strokeWidth={2} name="Total Readings" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="critical" stroke="#D32F2F" strokeWidth={2} name="Critical" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">No pollution data yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Inspections Status</Typography>
              {inspectionPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={inspectionPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                      {inspectionPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">No inspections yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Air color="primary" /> Recent Emissions
              </Typography>
              <List dense>
                {data?.recent?.emissions?.length > 0 ? (
                  data.recent.emissions.map((item) => (
                    <ListItem key={item._id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <StatusChip status={item.status} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${item.pollutant} — ${item.facility}`}
                        secondary={`${item.concentration} ${item.unit} / ${item.limitValue} ${item.unit} limit`}
                        slotProps={{ primary: { sx: { fontSize: "0.85rem", fontWeight: 500 } }, secondary: { sx: { fontSize: "0.75rem" } } }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No recent emissions</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Schedule color="warning" /> Upcoming Inspections
              </Typography>
              <List dense>
                {data?.upcoming?.inspections?.length > 0 ? (
                  data.upcoming.inspections.map((item) => (
                    <ListItem key={item._id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Assignment fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.facility}
                        secondary={`${item.category.replace(/-/g, " ")} — ${new Date(item.scheduledDate).toLocaleDateString()}`}
                        slotProps={{ primary: { sx: { fontSize: "0.85rem", fontWeight: 500 } }, secondary: { sx: { fontSize: "0.75rem" } } }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No upcoming inspections</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Description color="error" /> Pending Reports
              </Typography>
              <List dense>
                {data?.upcoming?.reports?.length > 0 ? (
                  data.upcoming.reports.map((item) => (
                    <ListItem key={item._id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Description fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={`Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                        slotProps={{ primary: { sx: { fontSize: "0.85rem", fontWeight: 500 } }, secondary: { sx: { fontSize: "0.75rem" } } }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No pending reports</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
