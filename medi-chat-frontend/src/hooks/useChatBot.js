// src/hooks/useChatBot.js

import { useEffect, useCallback, useReducer, useRef } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const STEPS = {
  START:         'start',
  POST_REGISTER: 'post_register',
  ASK_EMAIL:     'ask_email',
  LOGIN:         'login',
  CHOOSE_ROLE:   'choose_role',
  REG_NAME:      'reg_name',
  REG_PASS:      'reg_pass',
  REG_DETAILS:   'reg_details',
  VERIFY:        'verify',
  CHAT:          'chat'
};

const fieldPrompts = {
  patient: [
    { key: 'email',      prompt: 'What is your email address?' },
    { key: 'dob',        prompt: 'Date of birth? (YYYY/MM/DD)' },
    { key: 'ssnLast4',   prompt: 'Last 4 digits of SSN:' },
    { key: 'postalCode', prompt: 'Postal code (5 digits):' },
    { key: 'phone',      prompt: 'Phone number (10-15 digits):' }
  ],
  provider: [
    { key: 'email',            prompt: 'What is your email address?' },
    { key: 'institutionName',  prompt: 'Institution name:' },
    { key: 'institutionEmail', prompt: 'Institution email:' },
    { key: 'institutionPhone', prompt: 'Institution phone (10-15 digits):' },
    { key: 'npi',              prompt: 'NPI (optional):' },
    { key: 'address1',         prompt: 'Address line 1:' },
    { key: 'address2',         prompt: 'Address line 2 (optional):' },
    { key: 'city',             prompt: 'City:' },
    { key: 'stateCounty',      prompt: 'State/County:' },
    { key: 'postalCode',       prompt: 'Postal code (5 digits):' },
    { key: 'country',          prompt: 'Country:' }
  ]
};

const validators = {
  email:             v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  dob:               v => /^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/.test(v),
  ssnLast4:          v => /^[0-9]{4}$/.test(v),
  postalCode:        v => /^[0-9]{5}$/.test(v),
  phone:             v => /^[0-9]{10,15}$/.test(v),
  institutionEmail:  v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  institutionPhone:  v => /^[0-9]{10,15}$/.test(v),
  institutionName:   v => v.trim().length > 0,
  address1:          v => v.trim().length > 0,
  city:              v => /^[A-Za-z\s]+$/.test(v.trim()),
  stateCounty:       v => /^[A-Za-z\s]+$/.test(v.trim()),
  country:           v => /^[A-Za-z\s]+$/.test(v.trim())
};

const initialState = {
  messages:     [],
  step:         STEPS.START,
  userData:     {},
  promptsQueue: [],
  queueIndex:   0,
  loading:      false
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_MSG':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_USER':
      return { ...state, userData: { ...state.userData, ...action.payload } };
    case 'SET_QUEUE':
      return { ...state, promptsQueue: action.payload, queueIndex: 0 };
    case 'NEXT_QUEUE':
      return { ...state, queueIndex: state.queueIndex + 1 };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'AFTER_REGISTER':
      return {
        ...state,
        messages:     [action.payload],
        step:         STEPS.POST_REGISTER,
        userData:     {},
        promptsQueue: [],
        queueIndex:   0,
        loading:      false
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useChatBot() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const hasInitialized   = useRef(false);
  const roleRef          = useRef(null);

  const addMessage = useCallback((sender, text) => {
    dispatch({
      type: 'ADD_MSG',
      payload: { sender, text, timestamp: new Date().toLocaleTimeString() }
    });
  }, []);

  const handleText = async text => {
    // Mask passwords when typing
    if ([STEPS.LOGIN, STEPS.REG_PASS].includes(state.step)) {
      addMessage('user', '•'.repeat(text.length));
    } else {
      addMessage('user', text);
    }
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      switch (state.step) {
        case STEPS.START:
          addMessage('bot', text.toLowerCase() === 'login'
            ? 'Enter your email:'
            : text.toLowerCase() === 'register'
              ? 'Are you a patient or provider?'
              : 'Please type “login” or “register”.'
          );
          if (text.toLowerCase() === 'login') dispatch({ type: 'SET_STEP', payload: STEPS.ASK_EMAIL });
          else if (text.toLowerCase() === 'register') dispatch({ type: 'SET_STEP', payload: STEPS.CHOOSE_ROLE });
          break;

        case STEPS.POST_REGISTER:
          addMessage('bot', text.toLowerCase() === 'login'
            ? 'Enter your email:'
            : 'Please type “login” to sign in.'
          );
          if (text.toLowerCase() === 'login') dispatch({ type: 'SET_STEP', payload: STEPS.ASK_EMAIL });
          break;

        case STEPS.ASK_EMAIL: {
          if (!validators.email(text)) {
            addMessage('bot', 'Invalid email format.');
            break;
          }
          dispatch({ type: 'SET_USER', payload: { email: text } });
          addMessage('bot', 'Checking…');
          const { data } = await axios.post(`${API_URL}/api/check-user`, { email: text });
          if (data.exists) {
            addMessage('bot', 'Found. Enter password:');
            dispatch({ type: 'SET_STEP', payload: STEPS.LOGIN });
          } else {
            addMessage('bot', 'Not registered. Type “register” to sign up.');
            dispatch({ type: 'SET_STEP', payload: STEPS.START });
          }
          break;
        }

        case STEPS.LOGIN: {
          const pwdHash = CryptoJS.SHA256(text).toString();
          const res = await axios.post(`${API_URL}/api/login`, {
            email: state.userData.email,
            password: pwdHash
          });
          localStorage.setItem('token', res.data.token);
          addMessage('bot', `Logged in as ${res.data.name}!`);
          dispatch({ type: 'SET_STEP', payload: STEPS.CHAT });
          break;
        }

        case STEPS.CHOOSE_ROLE: {
          const lower = text.toLowerCase();
          const role = lower.startsWith('prov') ? 'provider'
                     : lower.startsWith('pat')  ? 'patient'
                     : null;
          if (!role) {
            addMessage('bot', 'Please type “patient” or “provider”.');
            break;
          }
          roleRef.current = role;
          dispatch({ type: 'SET_USER', payload: { role } });
          addMessage('bot', 'What is your full name?');
          dispatch({ type: 'SET_STEP', payload: STEPS.REG_NAME });
          break;
        }

        case STEPS.REG_NAME:
          dispatch({ type: 'SET_USER', payload: { name: text } });
          addMessage('bot', 'Choose a password:');
          dispatch({ type: 'SET_STEP', payload: STEPS.REG_PASS });
          break;

        case STEPS.REG_PASS:
          dispatch({ type: 'SET_USER',
            payload: { password: CryptoJS.SHA256(text).toString() }
          });
          dispatch({ type: 'SET_QUEUE', payload: fieldPrompts[roleRef.current] });
          addMessage('bot', fieldPrompts[roleRef.current][0].prompt);
          dispatch({ type: 'SET_STEP', payload: STEPS.REG_DETAILS });
          break;

        case STEPS.REG_DETAILS: {
          const { promptsQueue, queueIndex, userData } = state;
          const { key } = promptsQueue[queueIndex];
          const isOpt = ['npi','address2'].includes(key);
          const val = text.trim();

          // basic format validation
          if (!val && !isOpt) {
            addMessage('bot', `Invalid ${key}.`);
            break;
          }
          if (validators[key] && !validators[key](val)) {
            addMessage('bot', `Invalid ${key}. Please follow the correct format.`);
            break;
          }

          // extra DOB check
          if (key === 'dob') {
            const [y,m,d] = val.split('/').map(n=>parseInt(n,10));
            const monthDays = {1:31,2:((y%4===0&&y%100!==0)||y%400===0)?29:28,
                               3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31};
            if (m<1||m>12||d<1||d>monthDays[m]) {
              addMessage('bot','Invalid date. Enter a real calendar date.');
              break;
            }
            const dateObj = new Date(y,m-1,d);
            if (dateObj > new Date()) {
              addMessage('bot','Date cannot be in the future.');
              break;
            }
            userData[key] = dateObj;
          } else {
            userData[key] = val;
          }

          dispatch({ type: 'SET_USER', payload: { [key]: userData[key] } });

          if (queueIndex < promptsQueue.length - 1) {
            dispatch({ type: 'NEXT_QUEUE' });
            addMessage('bot', promptsQueue[queueIndex+1].prompt);
          } else {
            // clear chat when starting register
            dispatch({ type: 'RESET' });
            dispatch({ type: 'SET_LOADING', payload: true });
            addMessage('bot','⏳ Registering your account…');

            try {
              await axios.post(`${API_URL}/api/register`, userData);
              dispatch({
                type: 'AFTER_REGISTER',
                payload: {
                  sender: 'bot',
                  text:   '✅ You have registered! Type “login” to log into the system.',
                  timestamp: new Date().toLocaleTimeString()
                }
              });
            } catch (err) {
              if (err.response?.status === 400 &&
                  err.response?.data?.message === 'Email already in use') {
                addMessage('bot',
                  '⚠️ A user with this email already exists. Please try logging in or use a different email.'
                );
                dispatch({ type: 'SET_STEP', payload: STEPS.START });
              } else {
                addMessage('bot',
                  `❌ Registration failed: ${err.response?.data?.message || err.message}`
                );
                dispatch({ type: 'RESET' });
              }
            }
          }
          break;
        }

        case STEPS.VERIFY:
          await axios.post(`${API_URL}/api/verify-code`, {
            email: state.userData.email,
            code:  text
          });
          dispatch({ type: 'RESET' });
          addMessage('bot','Verified! Type “login” to sign in.');
          dispatch({ type: 'SET_STEP', payload: STEPS.POST_REGISTER });
          break;

        case STEPS.CHAT:
          addMessage('bot','…thinking…');
          const { data } = await axios.post(
            `${API_URL}/api/chat`,
            { prompt: text },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          addMessage('bot', data.reply);
          break;
      }
    } catch (err) {
      addMessage('bot', `${err.response?.data?.message || err.message}`);
      dispatch({ type: 'RESET' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      addMessage('bot','Welcome to MediChat!');
      addMessage('bot','Type “login” to sign in.');
      addMessage('bot','Type “register” to create an account.');
      hasInitialized.current = true;
    }
  }, [addMessage]);

  return { state, handleText, addMessage, dispatch };
}
