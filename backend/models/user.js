// backend/models/User.js
const mongoose = require('mongoose');

const options = { discriminatorKey: 'role', timestamps: true };

// 1) Base schema common to both Patient & Provider
const UserSchema = new mongoose.Schema({
  email:        { type: String, unique: true, required: true },
  name:         { type: String, required: true },         // full name
  passwordHash: { type: String, required: true },
  isVerified:   { type: Boolean, default: false },
  code:         String,
  codeExpires:  Date
}, options);

const User = mongoose.model('User', UserSchema);

// 2) Patient-specific schema
const PatientSchema = new mongoose.Schema({
  dob:         { type: Date, required: true },
  ssnLast4:    { type: String, required: true, minlength: 4, maxlength: 4 },
  postalCode:  { type: String, required: true },
  phone:       { type: String, required: true }
}, options);

// 3) Provider-specific schema
const ProviderSchema = new mongoose.Schema({
  institutionName:     { type: String, required: true },
  institutionEmail:    { type: String, required: true },
  institutionPhone:    { type: String, required: true },
  npi:                 { type: String }, // optional
  address1:            { type: String, required: true },
  address2:            String,
  city:                { type: String, required: true },
  stateCounty:         { type: String, required: true },
  postalCode:          { type: String, required: true },
  country:             { type: String, required: true }
}, options);

// 4) Create discriminators
const Patient  = User.discriminator('patient', PatientSchema);
const Provider = User.discriminator('provider', ProviderSchema);

module.exports = { User, Patient, Provider };
