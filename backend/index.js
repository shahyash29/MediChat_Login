require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sendEmail = require('./utils/sendEmail');
const { User, Patient, Provider } = require('./models/user');

const app = express();

const accessCodes = new Map();
const CODE_TL = 10 * 60 * 1000;

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



app.post('/api/chat', requireAuth, async (req, res) => {
  const { prompt } = req.body;
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const generation = await model.generateContent(prompt);
  const text = await generation.response.text();
  res.json({ reply: text });
});


app.post('/api/send-access-code', async(req, res) => {
  const {email} = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  accessCodes.set(email, {code, expires: Date.now() + CODE_TL});
  try{
    await sendEmail(
      email,
      'Your MediChat Access Code',
      `Hi there,\n\nYour access code is **${code}**. It expires in 10 minutes.\n\n– MediChat Team`
    );
    console.log(`Access code ${code} sent to ${email}`);
    res.json({ message: 'Access code sent.' });
  } catch (err) {
    console.warn('Failed to send access code email:', err);
    res.status(500).json({ message: 'Failed to send code' });
  }
});

app.post('/api/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email & code required.' });
  }

  const entry = accessCodes.get(email);
  if (!entry || Date.now() > entry.expires) {
    accessCodes.delete(email);
    return res.status(400).json({ message: 'Access code expired or not found.' });
  }
  if (entry.code !== code) {
    return res.status(400).json({ message: 'Invalid access code.' });
  }


  accessCodes.delete(email);


  const user = await User.findOne({ email, isVerified: true });
  if (!user) {
    return res.status(400).json({ message: 'No registered account found.' });
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
  
});



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
