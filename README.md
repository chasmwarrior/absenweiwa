# AbsensiBot Admin Dashboard

A comprehensive system for WhatsApp-based employee attendance, with an admin dashboard for geofence validation, setting dynamic rules, and viewing live pay previews.

## Features

- **WhatsApp Webhook Integration**: Check-in, check-out, and info commands.
- **Geofence Validation**: Validates user location on check-in.
- **Admin Dashboard**: Manage users, locations, and view pending attendances.
- **Pending Actions**: View and approve/reject attendances that fall outside business rules.
- **Live Pay Preview**: See estimated bonuses, overtime, and penalties based on attendance.
- **Data Management**: Export to JSON, clear old logs, and reset all data.

## Installation

### Prerequisites

- Node.js (v18+)
- npm
- Evolution API (or similar WhatsApp API provider if modifying webhook)

### Steps

1. **Clone the repository** (or download the source):
   ```bash
   git clone <repo-url>
   cd <repo-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file based on `.env.example`:
   ```env
   # .env
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

   For development with live-reload:
   ```bash
   npm run dev
   ```

### Default Credentials
Upon first run, the database is automatically seeded.
- **Admin ID**: `admin`
- **Password**: `admin123`

## WhatsApp Webhook Setup
In your WhatsApp API provider (e.g., Evolution API), set the Webhook URL to:
`http://your-domain.com/api/webhook`

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: Express, Node.js
- Database: SQLite with Drizzle ORM
