# Civic Issues Platform

A web application for citizens to report civic issues and government officials to manage and resolve them.

## Features

### Citizen Perspective
- Report civic issues with location and details
- View issues on an interactive map with category filters
- Upvote existing issues
- Comment on issues
- Track issue status

### Government Official Perspective
- View and manage department-specific issues
- Update issue status (acknowledge/in progress/resolved)
- Add resolution details
- View analytics and performance metrics

## Tech Stack

### Frontend
- React
- Material UI
- Leaflet for maps
- Axios for API calls

### Backend
- Node.js
- Express
- MongoDB
- Mongoose

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
```bash
git clone <repository-url>
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

5. Start the backend server
```bash
cd backend
npm start
```

6. Start the frontend development server
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- POST `/api/signup` - Register a new user
- POST `/api/login` - Login user

### Issues
- GET `/api/issues` - Get all issues
- POST `/api/issues` - Create a new issue
- GET `/api/issues/:id` - Get issue details
- PUT `/api/issues/:id` - Update issue status
- POST `/api/issues/:id/upvote` - Upvote an issue
- POST `/api/issues/:id/comments` - Add a comment to an issue

### Analytics
- GET `/api/analytics` - Get analytics data

## Project Structure

```
civic-issues-platform/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Issue.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── issues.js
│   │   └── analytics.js
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── ReportIssue.jsx
    │   │   ├── IssueDetails.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── Login.jsx
    │   │   └── Signup.jsx
    │   └── App.jsx
    └── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 