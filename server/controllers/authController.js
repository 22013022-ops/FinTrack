const User = require('../models/User');
const sendAuthResponse = require('../utils/sendAuthResponse');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const credentialsMessage = 'Email or password is incorrect.';

/** Registers a user after validating their details and hashing their password through the model hook. */
exports.signup = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    if (!fullName?.trim() || !email?.trim() || !password || !confirmPassword) return res.status(400).json({ message: 'All fields are required.' });
    if (!emailPattern.test(email.trim())) return res.status(400).json({ message: 'Please provide a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
    if (await User.exists({ email: email.trim().toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ fullName, email, password });
    return sendAuthResponse(res, 201, user);
  } catch (error) { next(error); }
};

/** Authenticates a user with bcrypt before issuing a short-lived signed token. */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: credentialsMessage });
    return sendAuthResponse(res, 200, user);
  } catch (error) { next(error); }
};

/** Returns the user restored from a verified Bearer token. */
exports.getMe = (req, res) => res.status(200).json({ user: req.user });
