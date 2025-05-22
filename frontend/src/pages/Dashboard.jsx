import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import axios from 'axios';

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [selectedStatus]);

  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/issues?status=${selectedStatus}`, {
        withCredentials: true
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/issues/${issueId}`, {
        status: newStatus,
        resolutionDetails: newStatus === 'resolved' ? resolutionDetails : undefined,
      }, {
        withCredentials: true
      });
      fetchIssues();
      setOpenDialog(false);
      setSelectedIssue(null);
      setResolutionDetails('');
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const handleOpenDialog = (issue) => {
    setSelectedIssue(issue);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIssue(null);
    setResolutionDetails('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Issue Management Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={selectedStatus}
            label="Filter by Status"
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="acknowledged">Acknowledged</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue._id}>
                  <TableCell>{issue.category}</TableCell>
                  <TableCell>{issue.details}</TableCell>
                  <TableCell>
                    {issue.location.coordinates[1].toFixed(4)}, {issue.location.coordinates[0].toFixed(4)}
                  </TableCell>
                  <TableCell>{issue.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(issue)}
                      sx={{ mr: 1 }}
                    >
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Update Issue Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={selectedIssue?.status}
              label="New Status"
              onChange={(e) => {
                const newStatus = e.target.value;
                if (newStatus === 'resolved') {
                  setSelectedIssue({ ...selectedIssue, status: newStatus });
                } else {
                  handleStatusChange(selectedIssue._id, newStatus);
                }
              }}
            >
              <MenuItem value="acknowledged">Acknowledge</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>

          {selectedIssue?.status === 'resolved' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Resolution Details"
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {selectedIssue?.status === 'resolved' && (
            <Button
              onClick={() => handleStatusChange(selectedIssue._id, 'resolved')}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 