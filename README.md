# Masterscheduling

A secure, link-based master scheduling application built with Azure Functions (TypeScript) and Azure Static Web Apps (React/TypeScript).

## Features

- **Super Admin Dashboard**: Login to manage all dealerships, create links, and manage templates
- **Dealership Management**: Create and manage dealerships with name, language, and access codes
- **Secure Link-Based Access**: Each dealership link has two codes (trainer/edit and customer/view) with encrypted storage
- **Department Management**: 4 department views (Parts, Service, Sales, Accounting) plus Master view
- **Session Management**: Full CRUD operations for scheduling sessions with templates
- **Role-Based Access**: Trainer codes can edit, customer codes can view selected departments
- **Timeline Visualization**: Master view shows all sessions organized by time, color-coded by department
- **Template System**: Create and manage session templates for quick session creation

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

### Super Admin (Dealership Management)

1. **Login**: 
   - Navigate to `/login`
   - Default credentials: `admin` / `admin123` (configure via environment variables in production)

2. **Manage Dealerships**:
   - View all dealerships and their links
   - Create new dealerships with name, language, and access codes
   - Generate secure links with trainer (edit) and customer (view) codes
   - Manage templates for scheduling sessions

3. **Create Templates**:
   - Define session templates for each department
   - Templates include default duration, attendee type, and session details
   - Templates can be loaded when creating new sessions

### Dealership Access (Trainer/Customer)

1. **Access Schedule**:
   - Click the generated link: `/?id=<unique-identifier>`
   - Enter trainer code (for editing) or customer code (for viewing)
   - Access based on password type: trainer codes can edit, customer codes can view

2. **Manage Sessions** (Trainer):
   - Switch between department tabs
   - Click "Add Session" to create new session
   - Load templates for quick session creation
   - Edit/delete sessions as needed

3. **View Schedule** (Customer):
   - View sessions in accessible departments
   - Customer codes have restricted department access

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
- `SUPER_ADMIN_USERNAME`: Super admin username (default: `admin`)
- `SUPER_ADMIN_PASSWORD`: Super admin password (default: `admin123`)
- `BASE_URL`: Base URL for generating access links

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (defaults to `/api`)
- `VITE_SUPER_ADMIN_USERNAME`: Super admin username for login (default: `admin`)
- `VITE_SUPER_ADMIN_PASSWORD`: Super admin password for login (default: `admin123`)

## Department Colors

- **Parts**: Blue (#3B82F6)
- **Service**: Green (#10B981)
- **Sales**: Orange (#F59E0B)
- **Accounting**: Purple (#8B5CF6)

## License

Proprietary - All rights reserved