import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

function IssueDetails() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const response = await axios.get(`${process.env.BACKEND_URL}/issues/${id}`, {
        withCredentials: true
      });
      setIssue(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error fetching issue details');
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      await axios.post(`${process.env.BACKEND_URL}/issues/${id}/upvote`, {}, {
        withCredentials: true
      });
      fetchIssue();
    } catch (error) {
      setError('Error upvoting issue');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.BACKEND_URL}/issues/${id}/comments`, {
        text: comment,
      }, {
        withCredentials: true
      });
      setComment('');
      setSuccess('Comment added successfully');
      fetchIssue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error adding comment');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{issue.category}</Typography>
          <Chip
            label={issue.status}
            color={
              issue.status === 'resolved'
                ? 'success'
                : issue.status === 'in_progress'
                ? 'warning'
                : 'default'
            }
          />
        </Box>

        <Typography variant="body1" paragraph>
          {issue.details}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Upvotes: {issue.upvotes}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleUpvote}
          >
            Upvote
          </Button>
        </Box>

        <Box sx={{ height: 300, mb: 2 }}>
          <MapContainer
            center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker
              position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
            >
              <Popup>
                <Typography variant="subtitle1">{issue.category}</Typography>
                <Typography variant="body2">{issue.details}</Typography>
              </Popup>
            </Marker>
          </MapContainer>
        </Box>

        {issue.resolutionDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resolution Details
            </Typography>
            <Typography variant="body1">
              {issue.resolutionDetails}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Comments
        </Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleComment} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Add a comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            Post Comment
          </Button>
        </Box>

        {issue.comments?.map((comment, index) => (
          <Paper key={index} sx={{ p: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {new Date(comment.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body1">{comment.text}</Typography>
          </Paper>
        ))}
      </Paper>
    </Box>
  );
}

export default IssueDetails; 