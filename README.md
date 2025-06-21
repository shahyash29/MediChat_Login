# MediChat – Agentic AI-Powered Registration & Login System

MediChat is a full-stack web application that uses a chatbot interface to allow **patients** and **healthcare providers** to register, log in, and chat with an AI assistant. It supports secure authentication, role-based data capture, and sends confirmation emails using **Azure Communication Services**.<br>

---

## Features

- **Chatbot-driven login and registration**  
  No traditional forms — the chatbot guides users through each step.<br>

- **Secure Authentication**  
  Passwords hashed with bcrypt and SHA256; JWT for session management.<br>

- **Email Notifications**  
  Users receive confirmation on registration and login via Azure Email.<br>

- **AI Chat Integration**  
  Logged-in users can interact with **Google Gemini AI** (Generative AI) for responses.<br>

- **Profile Page** <br>
  After successful login, users are automatically redirected to a protected profile page (/medichat/profile) where their personal details (for patients) or institution details (for providers) are displayed, with an option to log out.

---

## Profile Page

The Profile Page is built as a protected route in React Router. It fetches user data from the backend endpoint /api/me using the stored JWT. Depending on the user's role (patient or provider), it renders: <br>
Patients: Name, Email, Date of Birth, Phone, Postal Code. <br>
Providers: Name, Email, Institution Name, Institution Email, Institution Phone, Address. <br>
A "Logout" button clears the token and redirects the user back to the chatbot login screen. <br>

## Getting Started

1. **Clone the repo** <br>
      git clone https://github.com/yourusername/medichat.git <br>

2. **Create environment file** <br>
      cp .env.example .env <br>
      Then edit .env with your credentials: <br>
      MONGO_URI, JWT_SECRET,<br>
      AZURE_COMM_EMAIL_CONNECTION_STRING,<br>
      SENDER_EMAIL_ADDRESS,<br>
      GEMINI_API_KEY,<br>

3. **Run with Docker Compose** <br>
      Option A (build locally): docker compose up --build -d <br>
      Option B (use pre-built images): <br>
      - docker compose pull <br>
      - docker compose up -d <br>

4. **Verify services** <br>
      Backend: http://localhost:5001 <br>
      Frontend: http://localhost:3000/medichat <br>

5. **Stop all services** <br>
      docker compose down <br>

![chat_image](images/chat_image.png) <br>

## Working of My Agentic AI Chat System

![Email_Services](images/emailone.png) <br>

![Email_Services](images/emailThree.png)<br>

![Email_Services](images/emailTwo.png)<br>

![Profile_Image](images/profile.png)<br>





