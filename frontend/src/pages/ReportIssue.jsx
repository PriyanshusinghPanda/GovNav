import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function ReportIssue() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    details: '',
  });
  const [position, setPosition] = useState(null);
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        setPosition([latitude, longitude]);
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/issues', {
        ...formData,
        location: {
          type: 'Point',
          coordinates: [position[1], position[0]],
        },
      });

      if (response.data.message === 'Similar issue already reported nearby') {
        setError('A similar issue has already been reported nearby');
      } else {
        setSuccess('Issue reported successfully!');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      setError('Error reporting issue. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Report an Issue
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              label="Category"
              onChange={handleChange}
              required
            >
              <MenuItem value="road">Road Issues</MenuItem>
              <MenuItem value="water">Water Issues</MenuItem>
              <MenuItem value="electricity">Electricity Issues</MenuItem>
              <MenuItem value="sanitation">Sanitation Issues</MenuItem>
              <MenuItem value="other">Other Issues</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            name="details"
            label="Issue Details"
            value={formData.details}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle1" gutterBottom>
            Select Location on Map
          </Typography>
          <Box sx={{ height: 300, mb: 2 }}>
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Submit Issue
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default ReportIssue; 