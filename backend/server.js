const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cors = require("cors")
const UserModel = require("./models/User");
const IssueModel = require("./models/Issue");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require('cookie-parser');


dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    },
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email (mock implementation)
function sendOTP(email, otp) {
  console.log(`OTP for ${email}: ${otp}`);
  // In a real implementation, you would use an email service here
  return true;
}

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to check if user is a government employee
const isGovEmployee = (req, res, next) => {
  if (req.session.user && req.session.user.userType === 'gov_employee') {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Government employees only." });
  }
};

app.get("/user", (req, res) => {
  if (req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Internal server error" });
      } else {
        res.status(200).json({ message: "Logout successful" });
      }
    });
  } else {
    res.status(400).json({ message: "No session found" });
  }
});

app.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP via email
    sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      userType: user.userType
    };

    res.status(200).json({ 
      message: "OTP verified successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/signup", async (req, res) => {
  console.log("signup request received");
  try {
    const { name, email, password, userType, department } = req.body;
    
    if (!['citizen', 'gov_employee'].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Validate department for government employees
    if (userType === 'gov_employee' && !department) {
      return res.status(400).json({ message: "Department is required for government employees" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      userType,
      department: userType === 'gov_employee' ? department : undefined,
      isVerified: false
    });

    await user.save();

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    
    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP via email
    sendOTP(email, otp);

    res.status(201).json({ 
      message: "User created successfully. Please verify your email with OTP.",
      email: email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
    console.log("login request received");
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Email not verified",
        email: user.email
      });
    }

    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      userType: user.userType
    };

    res.status(200).json({ 
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Issues endpoints
app.get("/issues", async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const issues = await IssueModel.find(query).populate('reportedBy', 'name email');
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/issues/:id", async (req, res) => {
  try {
    const issue = await IssueModel.findById(req.params.id).populate('reportedBy', 'name email');
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/issues", isAuthenticated, async (req, res) => {
  try {
    const { category, details, location } = req.body;

    // Check for similar issues nearby (within 1km)
    const similarIssues = await IssueModel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location.coordinates
          },
          $maxDistance: 1000 // 1km
        }
      },
      category,
      status: { $ne: 'resolved' }
    });

    if (similarIssues.length > 0) {
      return res.status(400).json({ message: "Similar issue already reported nearby" });
    }

    const issue = new IssueModel({
      category,
      details,
      location,
      reportedBy: req.session.user.id
    });

    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/issues/:id", isGovEmployee, async (req, res) => {
  try {
    const { status, resolutionDetails } = req.body;
    const issue = await IssueModel.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.status = status;
    if (status === 'resolved' && resolutionDetails) {
      issue.resolutionDetails = resolutionDetails;
    }

    await issue.save();
    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/issues/:id/upvote", isAuthenticated, async (req, res) => {
  try {
    const issue = await IssueModel.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.upvotes += 1;
    await issue.save();
    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/issues/:id/comments", isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    const issue = await IssueModel.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.comments.push({ text });
    await issue.save();
    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Analytics endpoint
app.get("/analytics", isGovEmployee, async (req, res) => {
  try {
    const stats = await IssueModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});