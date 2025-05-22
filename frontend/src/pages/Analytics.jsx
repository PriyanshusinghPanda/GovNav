import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';

function Analytics() {
  const [stats, setStats] = useState([]);
  const [issues, setIssues] = useState([]);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const [statsResponse, issuesResponse] = await Promise.all([
        axios.get(`${process.env.BACKEND_URL}/analytics`, {
          withCredentials: true
        }),
        axios.get(`${process.env.BACKEND_URL}/issues`, {
          withCredentials: true
        })
      ]);
      setStats(statsResponse.data);
      setIssues(issuesResponse.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getStatusCount = (status) => {
    return stats.find(stat => stat._id === status)?.count || 0;
  };

  const getCategoryCount = (category) => {
    return issues.filter(issue => issue.category === category).length;
  };

  const getAverageResolutionTime = () => {
    const resolvedIssues = issues.filter(issue => issue.status === 'resolved');
    if (resolvedIssues.length === 0) return 0;

    const totalTime = resolvedIssues.reduce((acc, issue) => {
      const createdAt = new Date(issue.createdAt);
      const resolvedAt = new Date(issue.updatedAt);
      return acc + (resolvedAt - createdAt);
    }, 0);

    return Math.round(totalTime / (resolvedIssues.length * 24 * 60 * 60 * 1000));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Analytics Dashboard</Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Issues
                </Typography>
                <Typography variant="h4">
                  {issues.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Issues
                </Typography>
                <Typography variant="h4">
                  {getStatusCount('pending')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  In Progress
                </Typography>
                <Typography variant="h4">
                  {getStatusCount('in_progress')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Resolution Time (days)
                </Typography>
                <Typography variant="h4">
                  {getAverageResolutionTime()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Issues by Category
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Road Issues</TableCell>
                      <TableCell align="right">{getCategoryCount('road')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Water Issues</TableCell>
                      <TableCell align="right">{getCategoryCount('water')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Electricity Issues</TableCell>
                      <TableCell align="right">{getCategoryCount('electricity')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sanitation Issues</TableCell>
                      <TableCell align="right">{getCategoryCount('sanitation')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other Issues</TableCell>
                      <TableCell align="right">{getCategoryCount('other')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Issues by Status
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pending</TableCell>
                      <TableCell align="right">{getStatusCount('pending')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Acknowledged</TableCell>
                      <TableCell align="right">{getStatusCount('acknowledged')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>In Progress</TableCell>
                      <TableCell align="right">{getStatusCount('in_progress')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Resolved</TableCell>
                      <TableCell align="right">{getStatusCount('resolved')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Analytics; 