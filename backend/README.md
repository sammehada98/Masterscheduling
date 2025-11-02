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

### Azure Portal Setup

1. Create an Azure Function App in the Azure Portal.

2. **Configure Required Application Settings:**
   - `SQL_SERVER`: Your Azure SQL server name
   - `SQL_DATABASE`: Database name
   - `SQL_USER`: Database username
   - `SQL_PASSWORD`: Database password
   - `JWT_SECRET`: Secret for JWT signing
   - `JWT_EXPIRY`: Token expiry time (e.g., "24h")
   - **`WEBSITE_RUN_FROM_PACKAGE=1`**: **Required** - Enables zip deployment and runs from the deployment package (recommended by Azure)

3. **Deployment Method**: This project uses **Zip Deployment** via GitHub Actions (recommended by Azure).
   - The GitHub Actions workflow automatically handles zip deployment
   - Ensure `WEBSITE_RUN_FROM_PACKAGE=1` is set in the Function App configuration
   - Deployment happens automatically on push to `main` branch

### Manual Deployment (Alternative)

If deploying manually using Azure Functions Core Tools:
```bash
func azure functionapp publish <your-function-app-name>
```

### Deployment Best Practices

- ✅ **Zip Deployment with WEBSITE_RUN_FROM_PACKAGE=1**: Already configured (recommended)
- ✅ **Use Deployment Slots**: Consider deploying to a staging slot and swapping to production to avoid locked files
- ✅ **Verify Deployment**: After deployment, check the SCM endpoint (`https://'functionAppName'.scm.azurewebsites.net`) and verify files in `d:\home\data\packages`
- 🔄 **Sync Triggers**: If triggers are not working after deployment, manually sync triggers in the Azure Portal

### Debugging Deployment Issues

- **Verify Package Contents**: Check `https://'functionAppName'.scm.azurewebsites.net` → Debug Console → `d:\home\data\packages` directory
- **Storage Account**: For Linux deployments with remote build, check the Storage account in `AzureWebJobsStorage` setting for zip files in the `scm-releases` container

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
