require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sendEmail = require('./utils/sendEmail');
const { User, Patient, Provider } = require('./models/user');

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

app.post('/api/check-user', async (req, res) => {
  const { email } = req.body;
  const exists = await User.exists({ email });
  res.json({ exists: Boolean(exists) });
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, name, password, role, ...rest } = req.body;

    if (await User.exists({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let userDoc;

    if (role === 'patient') {
      userDoc = await Patient.create({
        email,
        name,
        passwordHash,
        role,
        isVerified: true,
        dob: rest.dob,
        ssnLast4: rest.ssnLast4,
        postalCode: rest.postalCode,
        phone: rest.phone,
      });
    } else {
      userDoc = await Provider.create({
        email,
        name,
        passwordHash,
        role,
        isVerified: true,
        institutionName: rest.institutionName,
        institutionEmail: rest.institutionEmail,
        institutionPhone: rest.institutionPhone,
        npi: rest.npi,
        address1: rest.address1,
        address2: rest.address2,
        city: rest.city,
        stateCounty: rest.stateCounty,
        postalCode: rest.postalCode,
        country: rest.country,
      });
    }

    const token = jwt.sign(
      { sub: userDoc.id, role: userDoc.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    try {
      console.log('Attempting to send email to:', email);
      await sendEmail(
        email,
        'Welcome to MediChat',
        'Thank you for registering in MediChat.'
      );
    } catch (emailErr) {
      console.warn('⚠️ Email failed to send:', emailErr.message);
    }

    res.json({ name: userDoc.name, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      return res.status(400).json({ message: 'No verified account found' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    try {
      console.log('Attempting to send email to:', email);
      await sendEmail(
        email,
        'Login Successful',
        'You have successfully logged in to MediChat.'
      );
    } catch (emailErr) {
      console.warn('⚠️ Login email failed:', emailErr.message);
    }

    res.json({ name: user.name, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/chat', requireAuth, async (req, res) => {
  const { prompt } = req.body;
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const generation = await model.generateContent(prompt);
  const text = await generation.response.text();
  res.json({ reply: text });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
