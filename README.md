# EventHive – CampusConnect

EventHive is a full-stack university event management and registration system built using the MERN stack.

## Features

### Student
- Secure registration and login.
- Browse, search, and filter campus events.
- Register for events and cancel registrations.
- View upcoming and past registered events.
- Submit ratings and feedback for attended events.

### Organizer
- Register subject to administrator approval.
- Create, edit, and delete events.
- Upload event posters.
- View registered attendees.
- Mark student attendance.
- Export attendee lists as CSV files.

### Admin
- View platform statistics.
- Approve organizer accounts.
- Manage users and remove inappropriate events.

## Technologies
- React, React Router DOM, Vite and Bootstrap.
- Node.js and Express.
- MongoDB and Mongoose.
- Axios, JWT, bcrypt and Multer.
- Oxlint, Git and GitHub.

## Project Structure
- public/: Static assets.
- src/: React frontend, components, context and pages.
- server/models/: MongoDB models.
- server/routes/: Backend API routes.
- server/middleware/: Authentication and authorization.
- server/uploads/: Uploaded event posters.
- server/server.js: Express application.
- server/seedAdmin.js: Administrator account setup.

## Getting Started

### Prerequisites
- Node.js and npm.
- MongoDB database, such as MongoDB Atlas.
- Git.

### 1. Clone the repository
git clone https://github.com/HashimAshraf/EventHive.git
cd EventHive

### 2. Install dependencies
npm install

### 3. Configure environment variables
Create a .env file in the project root using .env.example as a template.

Configure:
- PORT=5000
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_long_random_secret
- ADMIN_NAME=EventHive Admin
- ADMIN_EMAIL=admin@example.com
- ADMIN_PASSWORD=your_admin_password

Replace placeholders with your own values. Never commit your .env file.

### 4. Create the administrator account
node --env-file=.env server/seedAdmin.js

### 5. Start the backend
Open a terminal in the project directory and run:
npm run server

The backend runs at http://localhost:5000.

### 6. Start the frontend
Open a second terminal and run:
npm run dev

Open the local URL displayed by Vite, normally http://localhost:5173.

Keep both servers running while using the application.

## Account Roles
- Student: Can register and use student features.
- Organizer: Requires administrator approval before logging in.
- Admin: Created using the administrator seed script.

## Poster Uploads
Supported formats: JPEG, PNG and WebP.
Maximum file size: 512 KB.
Uploaded posters are stored in server/uploads/.

## Available Scripts
- npm run dev: Start the frontend.
- npm run server: Start the backend.
- npm run build: Create the production frontend build.
- npm run preview: Preview the production build.
- npm run lint: Check the project using Oxlint.

## Verification
Run npm run lint and npm run build. Both should complete successfully.

## Security
- Passwords are hashed using bcrypt.
- JWT is used for authentication.
- Backend routes enforce role-based authorization.
- Environment variables and secrets are excluded from Git.
- .env.example documents required configuration without exposing credentials.

## Database
MongoDB stores application data, and Mongoose provides schemas and database operations.

## License
This project was developed as a university Web Programming project.
