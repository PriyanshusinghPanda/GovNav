import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

function Home() {
  const [issues, setIssues] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [center, setCenter] = useState([20.5937, 78.9629]); // Default to India center

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );

    // Fetch issues
    const fetchIssues = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/issues`, {
          withCredentials: true
        });
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    };

    fetchIssues();
  }, []);

  const filteredIssues = selectedCategory === 'all'
    ? issues
    : issues.filter(issue => issue.category === selectedCategory);

  return (
    <Box sx={{ height: 'calc(100vh - 64px)' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Civic Issues Map
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Category"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="road">Road Issues</MenuItem>
            <MenuItem value="water">Water Issues</MenuItem>
            <MenuItem value="electricity">Electricity Issues</MenuItem>
            <MenuItem value="sanitation">Sanitation Issues</MenuItem>
            <MenuItem value="other">Other Issues</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredIssues.map((issue) => (
          <Marker
            key={issue._id}
            position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
          >
            <Popup>
              <Typography variant="subtitle1">{issue.category}</Typography>
              <Typography variant="body2">{issue.details}</Typography>
              <Typography variant="caption" color="text.secondary">
                Status: {issue.status}
              </Typography>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}

export default Home; 