# Master Scheduling App - Backend (Azure Functions)

This is the backend API for the Master Scheduling App, built with Azure Functions and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure database connection in `local.settings.json`:
```json
{
  "Values": {
    "SQL_SERVER": "your-server.database.windows.net",
    "SQL_DATABASE": "your-database",
    "SQL_USER": "your-username",
    "SQL_PASSWORD": "your-password",
    "JWT_SECRET": "your-secure-random-secret-key",
    "JWT_EXPIRY": "24h"
  }
}
```

3. Run the database schema from `../database/schema.sql` in your Azure SQL Database.

4. Start the functions locally:
```bash
npm start
```

## Deployment

1. Create an Azure Function App in the Azure Portal.

2. Configure Application Settings with your database credentials and JWT secret.

3. Deploy using Azure Functions Core Tools:
```bash
func azure functionapp publish <your-function-app-name>
```

## API Endpoints

### Authentication
- `POST /api/auth/validateCode` - Validate code and get JWT token

### Links
- `GET /api/links/getLink` - Get link information (requires auth)
- `POST /api/links/createLink` - Create a new link (admin only)

### Sessions
- `GET /api/sessions/getSessions?department=<dept>` - Get sessions (requires auth)
- `POST /api/sessions/createSession` - Create session (admin only)
- `PUT /api/sessions/updateSession?id=<id>` - Update session (admin only)
- `DELETE /api/sessions/deleteSession?id=<id>` - Delete session (admin only)

### Templates
- `GET /api/templates/getTemplates?department=<dept>` - Get templates (requires auth)
- `POST /api/templates/saveTemplate` - Save template (admin only)

### Departments
- `GET /api/departments/getDepartments` - Get department info (requires auth)

## Security Features

- JWT-based authentication
- Code hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- SQL injection prevention
- Role-based access control (admin vs customer)
