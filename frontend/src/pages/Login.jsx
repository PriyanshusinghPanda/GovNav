import { useState } from 'react';
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
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'citizen',
  });
  const [error, setError] = useState('');

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

    // try {
    //   const response = await axios.post('http://localhost:5000/api/login', formData);
    //   localStorage.setItem('token', response.data.token);
    //   localStorage.setItem('userType', formData.userType);
    //   navigate(formData.userType === 'citizen' ? '/' : '/dashboard');
    // } catch (error) {
    //   setError(error.response?.data?.message || 'Login failed. Please try again.');
    // }
    try {
      const response = await axios.post(
        'http://localhost:8080/login',
        formData,
        {
          withCredentials: true, // ✅ This is necessary when credentials are enabled in backend CORS
        }
      );
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', formData.userType);
      navigate(formData.userType === 'citizen' ? '/' : '/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom align="center">
          Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>User Type</InputLabel>
            <Select
              name="userType"
              value={formData.userType}
              label="User Type"
              onChange={handleChange}
            >
              <MenuItem value="citizen">Citizen</MenuItem>
              <MenuItem value="gov_employee">Government Employee</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 2 }}
          >
            Login
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/signup')}
          >
            Don't have an account? Sign up
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default Login; 