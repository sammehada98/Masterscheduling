# Master Scheduling App

A secure, link-based master scheduling application built with Azure Functions (TypeScript) and Azure Static Web Apps (React/TypeScript).

## Features

- **Secure Link-Based Access**: Each link has two codes (admin and customer) with encrypted storage
- **Department Management**: 5 department views (Parts, Service, Sales, Accounting) plus Master view
- **Session Management**: Full CRUD operations for scheduling sessions with templates
- **Role-Based Access**: Admin codes can edit, customer codes can view selected departments
- **Timeline Visualization**: Master view shows all sessions organized by time, color-coded by department
- **Template System**: Load session templates for quick session creation

## Architecture

- **Frontend**: React + TypeScript, deployed to Azure Static Web Apps
- **Backend**: Azure Functions (Node.js/TypeScript)
- **Database**: Azure SQL Database
- **Authentication**: JWT tokens with code-based authentication

## Project Structure

```
Mastersheduling/
├── frontend/          # React TypeScript frontend
├── backend/            # Azure Functions backend
├── database/          # SQL schema
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Azure subscription
- Azure SQL Database
- Azure Functions Core Tools

### Setup

1. **Database Setup**:
   - Create an Azure SQL Database
   - Run `database/schema.sql` to create tables

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```
   - Configure `local.settings.json` with database credentials
   - Start locally: `npm start`

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```
   - Start dev server: `npm run dev`

### Deployment

1. **Deploy Backend**:
   - Create Azure Function App
   - Configure Application Settings (database credentials, JWT_SECRET)
   - Deploy: `func azure functionapp publish <function-app-name>`

2. **Deploy Frontend**:
   - Create Azure Static Web App
   - Configure API proxy to point to your Function App
   - Deploy via GitHub Actions or Azure CLI

## Usage

1. **Create a Link** (Admin):
   - Access `/admin` with admin credentials
   - Generate a link with admin and customer codes
   - Share the link URL with users

2. **Access Schedule**:
   - User clicks the link: `/?id=<unique-identifier>`
   - Enters their code (admin or customer)
   - Views/edit sessions based on permissions

3. **Manage Sessions** (Admin):
   - Switch between department tabs
   - Click "Add Session" to create new session
   - Use templates for quick session creation
   - Edit/delete sessions as needed

4. **Master View**:
   - View all departments in a timeline
   - Sessions color-coded by department
   - Organized by date and time

## Security

- Code hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting
- SQL injection prevention
- HTTPS enforcement

## Environment Variables

### Backend (local.settings.json)
- `SQL_SERVER`: Azure SQL server
- `SQL_DATABASE`: Database name
- `SQL_USER`: Database username
- `SQL_PASSWORD`: Database password
- `JWT_SECRET`: Secret for JWT signing
- `JWT_EXPIRY`: Token expiry time

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (defaults to `/api`)

## Department Colors

- **Parts**: Blue (#3B82F6)
- **Service**: Green (#10B981)
- **Sales**: Orange (#F59E0B)
- **Accounting**: Purple (#8B5CF6)

## License

Proprietary - All rights reserved