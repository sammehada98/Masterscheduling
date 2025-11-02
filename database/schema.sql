-- Master Scheduling App Database Schema
-- Azure SQL Database

-- Links table: Stores secure links with admin and customer codes
CREATE TABLE Links (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    uniqueIdentifier NVARCHAR(255) UNIQUE NOT NULL,
    dealershipName NVARCHAR(255) NOT NULL,
    language NVARCHAR(10) NOT NULL DEFAULT 'en',
    trainerCodeHash NVARCHAR(255) NOT NULL,
    customerCodeHash NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    createdBy NVARCHAR(255),
    CONSTRAINT CHK_Language CHECK (language IN ('en', 'fr'))
);

-- LinkDepartments table: Maps customer codes to accessible departments
CREATE TABLE LinkDepartments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    linkId UNIQUEIDENTIFIER NOT NULL,
    department NVARCHAR(50) NOT NULL,
    customerCodeHash NVARCHAR(255) NOT NULL,
    FOREIGN KEY (linkId) REFERENCES Links(id) ON DELETE CASCADE,
    CONSTRAINT CHK_Department CHECK (department IN ('Parts', 'Service', 'Sales', 'Accounting'))
);

-- Sessions table: Stores all scheduling sessions
CREATE TABLE Sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    linkId UNIQUEIDENTIFIER NOT NULL,
    department NVARCHAR(50) NOT NULL,
    sessionCode NVARCHAR(100) NOT NULL,
    sessionName NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    academyCourse NVARCHAR(255),
    attendeeType NVARCHAR(100),
    startDateTime DATETIME2 NOT NULL,
    duration INT NOT NULL, -- Duration in minutes
    sessionCount INT DEFAULT 1,
    createdBy NVARCHAR(255),
    updatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (linkId) REFERENCES Links(id) ON DELETE CASCADE,
    CONSTRAINT CHK_SessionDepartment CHECK (department IN ('Parts', 'Service', 'Sales', 'Accounting'))
);

-- Templates table: Stores session templates for each department
CREATE TABLE Templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    department NVARCHAR(50) NOT NULL,
    sessionCode NVARCHAR(100) NOT NULL,
    sessionName NVARCHAR(255) NOT NULL,
    sessionNameFr NVARCHAR(255),
    description NVARCHAR(MAX),
    descriptionFr NVARCHAR(MAX),
    academyCourse NVARCHAR(255),
    academyCourseFr NVARCHAR(255),
    defaultAttendeeType NVARCHAR(100),
    defaultAttendeeTypeFr NVARCHAR(100),
    defaultDuration INT NOT NULL, -- Default duration in minutes
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT CHK_TemplateDepartment CHECK (department IN ('Parts', 'Service', 'Sales', 'Accounting'))
);

-- AccessLogs table: Tracks access for security monitoring
CREATE TABLE AccessLogs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    linkId UNIQUEIDENTIFIER NOT NULL,
    codeType NVARCHAR(20) NOT NULL, -- 'trainer' or 'customer'
    accessedAt DATETIME2 DEFAULT GETUTCDATE(),
    ipAddress NVARCHAR(45),
    userAgent NVARCHAR(500),
    FOREIGN KEY (linkId) REFERENCES Links(id) ON DELETE CASCADE,
    CONSTRAINT CHK_CodeType CHECK (codeType IN ('trainer', 'customer'))
);

-- Indexes for performance
CREATE INDEX IX_Links_UniqueIdentifier ON Links(uniqueIdentifier);
CREATE INDEX IX_LinkDepartments_LinkId ON LinkDepartments(linkId);
CREATE INDEX IX_LinkDepartments_CustomerCodeHash ON LinkDepartments(customerCodeHash);
CREATE INDEX IX_Sessions_LinkId ON Sessions(linkId);
CREATE INDEX IX_Sessions_Department ON Sessions(department);
CREATE INDEX IX_Sessions_StartDateTime ON Sessions(startDateTime);
CREATE INDEX IX_Templates_Department ON Templates(department);
CREATE INDEX IX_AccessLogs_LinkId ON AccessLogs(linkId);
CREATE INDEX IX_AccessLogs_AccessedAt ON AccessLogs(accessedAt);
