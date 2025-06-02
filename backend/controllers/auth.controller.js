// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token'); // optional, if storing refresh tokens
const admin = require('../middleware/firebaseAdmin')

//Helper function generate JWT token
const generateAccessToken = (user) => {
  return jwt.sign( 
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashed });

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Optional: Save refresh token to DB
    await Token.findOneAndUpdate(
      { userId: user._id },
      { refreshToken },
      { upsert: true }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken, user: { id: user._id, username: user.username, role: user.role, avatarUrl: user.avatarUrl} }); 
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'None', secure: true });
  await Token.findOneAndDelete({ refreshToken: req.cookies.refreshToken });
  res.status(200).json({ message: 'Logged out' });
};

exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'No ID token provided' });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    // Check if user exists in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        username: name || email.split('@')[0],
        email,
        googleUid: uid,
      });
      await user.save();
    } else {
      // Update existing user with Google UID if not set
      if (!user.googleUid) {
        user.googleUid = uid;
        await user.save();
      }
    }

    // Generate custom JWT
    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    res.status(400).json({ message: 'Google authentication failed', error: err.message });
  }
};