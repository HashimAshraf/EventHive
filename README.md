# EventHive

EventHive is a React-based university event management frontend. It allows students to discover and register for campus events, organizers to manage events and attendance, and administrators to moderate platform activity.

## Features

### Student
- Browse and search university events.
- View event details and availability.
- Register for events or cancel registrations.
- View registered and completed events.
- Submit feedback for past events.

### Organizer
- Create, edit, and remove events.
- Upload event posters.
- View event registrations.
- Track attendee attendance.
- Export attendee lists as CSV files.

### Admin
- Review and approve organizer requests.
- Search and manage users.
- Review and remove events.
- View platform statistics.

## Technologies

- React
- React Router
- Vite
- JavaScript
- CSS
- Oxlint

## Getting Started

### Prerequisites

Install Node.js and npm before running the project.

### Installation

Clone the repository:

```bash
git clone https://github.com/HashimAshraf/campusconnect.git
```

Navigate into the project directory:

```bash
cd campusconnect
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Demo Access

Use the Student, Organizer, or Admin buttons on the login page to explore the available demo roles.

The application uses browser local storage to maintain demo accounts, registrations, events, and other application data.

To reset the demo, clear the site's local storage in your browser.

## Poster Uploads

Supported image formats:
- JPEG
- PNG
- WebP

Maximum poster file size: 512 KB.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run lint` | Checks source code using Oxlint |
| `npm run build` | Creates the production build |
| `npm run preview` | Previews the production build locally |

## Project Verification

Before considering the project ready, run:

```bash
npm run lint
npm run build
```

Both commands should complete successfully.

## Important Note

EventHive is a frontend demonstration project. Application data is stored in browser local storage rather than a production backend.