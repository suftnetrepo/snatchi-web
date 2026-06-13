# Engineer Service Rates Implementation

Date: 13 June 2026

## Overview

Implemented a complete Engineer Service Rates feature following the existing project architecture (models → services → API routes).

## Files Created

### 1. Model
- **File**: `app/api/models/engineerServiceRate.js`
- **Purpose**: Database schema definition for engineer service rates
- **Fields**:
  - `engineer` (ObjectId ref User, required) - Reference to the engineer
  - `serviceName` (String, required) - Name of the service
  - `rate` (Number, required, min 0) - Rate amount
  - `rateType` (String enum, default 'hourly') - Type: 'hourly', 'daily', or 'fixed'
  - `description` (String, default '') - Service description
  - `active` (Boolean, default true) - Soft delete flag
  - `timestamps` - Created and updated timestamps

### 2. Service Layer
- **File**: `app/api/services/engineerServiceRate.js`
- **Purpose**: Business logic for engineer service rates
- **Functions**:
  - `createEngineerServiceRate()` - Create a new service rate
  - `getEngineerServiceRates()` - List all active rates for an engineer
  - `getEngineerServiceRateById()` - Get a specific service rate
  - `updateEngineerServiceRate()` - Update an existing service rate
  - `deleteEngineerServiceRate()` - Soft delete (sets active to false)

**Key Features**:
- Input validation for all fields
- Ownership validation (engineer can only manage their own rates)
- Active record filtering (only returns active=true records)
- Error handling with statusCode attachment
- Logger integration for all errors

### 3. API Route
- **File**: `app/api/engineer-service-rate/route.js`
- **Purpose**: Next.js API endpoint handler
- **Exports**: `GET`, `POST`, `PUT`, `DELETE` handlers

## API Endpoints

### 1. List Engineer Service Rates
```
GET /api/engineer-service-rate?action=list&engineerId=USER_ID
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "RATE_ID",
      "engineer": "ENGINEER_ID",
      "serviceName": "Web Development",
      "rate": 75,
      "rateType": "hourly",
      "description": "Full-stack web development services",
      "active": true,
      "createdAt": "2026-06-13T10:00:00.000Z",
      "updatedAt": "2026-06-13T10:00:00.000Z",
      "__v": 0
    }
  ]
}
```

### 2. Create Service Rate
```
POST /api/engineer-service-rate
```

**Request Body**:
```json
{
  "engineerId": "ENGINEER_ID",
  "serviceName": "Mobile App Development",
  "rate": 100,
  "rateType": "hourly",
  "description": "Native iOS and Android development"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "RATE_ID",
    "engineer": "ENGINEER_ID",
    "serviceName": "Mobile App Development",
    "rate": 100,
    "rateType": "hourly",
    "description": "Native iOS and Android development",
    "active": true,
    "createdAt": "2026-06-13T10:05:00.000Z",
    "updatedAt": "2026-06-13T10:05:00.000Z",
    "__v": 0
  }
}
```

### 3. Get Service Rate by ID
```
GET /api/engineer-service-rate?action=getById&rateId=RATE_ID
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "RATE_ID",
    "engineer": "ENGINEER_ID",
    "serviceName": "Web Development",
    "rate": 75,
    "rateType": "hourly",
    "description": "Full-stack web development services",
    "active": true,
    "createdAt": "2026-06-13T10:00:00.000Z",
    "updatedAt": "2026-06-13T10:00:00.000Z",
    "__v": 0
  }
}
```

### 4. Update Service Rate
```
PUT /api/engineer-service-rate
```

**Request Body**:
```json
{
  "rateId": "RATE_ID",
  "engineerId": "ENGINEER_ID",
  "serviceName": "Full-Stack Web Development",
  "rate": 85,
  "description": "Updated description"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "RATE_ID",
    "engineer": "ENGINEER_ID",
    "serviceName": "Full-Stack Web Development",
    "rate": 85,
    "rateType": "hourly",
    "description": "Updated description",
    "active": true,
    "createdAt": "2026-06-13T10:00:00.000Z",
    "updatedAt": "2026-06-13T10:10:00.000Z",
    "__v": 0
  }
}
```

### 5. Delete Service Rate (Soft Delete)
```
DELETE /api/engineer-service-rate?rateId=RATE_ID&engineerId=ENGINEER_ID
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Service rate deleted successfully",
    "data": {
      "_id": "RATE_ID",
      "engineer": "ENGINEER_ID",
      "serviceName": "Web Development",
      "rate": 75,
      "rateType": "hourly",
      "description": "Full-stack web development services",
      "active": false,
      "createdAt": "2026-06-13T10:00:00.000Z",
      "updatedAt": "2026-06-13T10:12:00.000Z",
      "__v": 0
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Status Codes**:
- `400` - Bad request (invalid input, missing required fields)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (permission denied, engineer trying to access another engineer's rate)
- `404` - Not found (service rate not found)
- `500` - Server error

**Example Error Response**:
```json
{
  "success": false,
  "error": "You can only manage your own service rates"
}
```

## Access Control Rules

### Engineer Role
- Can create rates for themselves only
- Can list, update, and delete only their own rates
- Cannot access rates of other engineers

### Admin Role
- Can create rates for any engineer
- Can list, update, and delete rates for any engineer
- Full unrestricted access

### Other Roles
- Guest, Integrator, Manager roles: **Denied** — Cannot access this feature

## Validation Rules

### serviceName
- Required
- Must be a non-empty string after trimming
- Trimmed before storage

### rate
- Required
- Must be a non-negative number
- Supports decimals (e.g., 75.50)

### rateType
- Optional (defaults to 'hourly')
- Must be one of: `hourly`, `daily`, `fixed`

### description
- Optional
- Defaults to empty string
- Trimmed before storage

## Soft Delete Implementation

The `deleteEngineerServiceRate()` function does not permanently remove records. Instead:
- Sets `active: false`
- Preserves the document for audit trails
- Subsequent list queries filter out inactive records
- The `getEngineerServiceRateById()` function only returns active records

## Architecture Compliance

✅ **Model**: Schema definition only in `app/api/models/`
✅ **Service**: Business logic in `app/api/services/`
✅ **Routes**: API handlers in `app/api/` folder
✅ **Error Handling**: Consistent pattern with statusCode attachment
✅ **Authentication**: Uses existing `getUserSession()` pattern
✅ **Validation**: Input validation at service layer
✅ **Ownership**: Enforced for all operations
✅ **Logging**: Using shared logger utility

## Key Design Decisions

1. **Soft Delete**: Using `active: false` instead of permanent deletion to preserve audit trail
2. **Service Layer Validation**: All input validation happens in the service layer before database operations
3. **Ownership Enforcement**: The `assertEngineerOwnership()` helper validates engineer owns the rate
4. **Active Filtering**: List operations only return `active: true` records
5. **Error StatusCode**: Errors include a `statusCode` property for proper HTTP status responses
6. **Query Params**: GET and DELETE use query parameters (like scheduler)
7. **Request Body**: POST and PUT use JSON request body (like user)

## Testing Considerations

### Engineer Creating Own Rate
```bash
POST /api/engineer-service-rate
Headers: Authorization (engineer token)
Body: { serviceName, rate, rateType, description }
```

### Engineer Listing Own Rates
```bash
GET /api/engineer-service-rate?action=list&engineerId=ENGINEER_ID
Headers: Authorization (engineer token)
```

### Engineer Cannot Access Another's Rate
```bash
GET /api/engineer-service-rate?action=getById&rateId=OTHER_ENGINEER_RATE
Expected: 403 Forbidden
```

### Admin Full Access
```bash
GET /api/engineer-service-rate?action=list&engineerId=ANY_ENGINEER_ID
Headers: Authorization (admin token)
Expected: 200 OK with all active rates
```

## Assumptions Made

1. **Authentication**: Assumes `getUserSession()` works and returns user object with `id`, `role`, and `integrator` fields
2. **User Model**: Assumes User model exists with `role` field that includes 'engineer'
3. **MongoDB**: Assumes MongoDB is connected via `mongoConnect()`
4. **Logger**: Assumes logger utility is available at `../utils/logger`
5. **Helpers**: Assumes `isValidObjectId()` utility exists at `../utils/helps`
6. **Next.js**: Assumes Next.js App Router is configured
7. **Request/Response**: Uses standard `NextResponse` from Next.js
8. **Timestamps**: Mongoose automatically handles `createdAt` and `updatedAt`

## Summary

This implementation provides a complete, secure, and maintainable engineer service rates feature that:
- Follows the project's established architectural patterns
- Enforces ownership and access control
- Uses soft deletes for data preservation
- Provides clear, consistent error messages
- Integrates seamlessly with existing authentication
- Validates all inputs at the service layer
