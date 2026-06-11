# Engineer Address Update Implementation

Date: 28 May 2026

## Service Function Added

Added `updateEngineerAddress({ userId, address })` in [app/api/services/user.js](/Users/appdev/dev/snatchi-next/app/api/services/user.js).

The implementation:
- validates `userId`
- validates `address`
- restricts updates to approved `address.*` fields only
- uses `$set` with dot notation for safe partial updates
- validates GeoJSON-style location coordinates
- enforces engineer/admin-only access
- returns the updated user address payload

## API Endpoint Added

Added support in [app/api/user/route.js](/Users/appdev/dev/snatchi-next/app/api/user/route.js):

```http
PUT /api/user?action=updateAddress
```

Request body:

```json
{
  "userId": "USER_ID",
  "address": {
    "addressLine1": "10 Oxford Street",
    "town": "London",
    "postcode": "SW1A 1AA",
    "country": "United Kingdom"
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "_id": "USER_ID",
    "address": {
      "addressLine1": "10 Oxford Street",
      "town": "London",
      "postcode": "SW1A 1AA",
      "country": "United Kingdom"
    }
  }
}
```

## Validation Rules

Validated rules:
- `userId` is required
- `userId` must be a valid Mongo ObjectId
- `address` must exist
- `address` must be an object
- `status` is not involved in this endpoint
- only allowed address fields can be updated
- `location.coordinates` must be an array of two numbers
- `location.type`, if provided, must be `Point`

## Security Rules

The service enforces:
- engineer can only update their own address
- integrator is denied
- guest is denied
- admin is allowed

## Partial Update Strategy

The implementation does not overwrite the full user document or the full `address` object.

It uses `$set` with dot notation, for example:

```js
$set: {
  'address.addressLine1': '10 Oxford Street',
  'address.town': 'London'
}
```

For location:

```js
$set: {
  'address.location.type': 'Point',
  'address.location.coordinates': [lng, lat]
}
```

## Allowed Address Fields

Only these fields are allowed:
- `addressLine1`
- `county`
- `town`
- `country`
- `country_code`
- `postcode`
- `completeAddress`
- `location`

## Disallowed Fields

These cannot be updated through this endpoint:
- `email`
- `role`
- `password`
- `integrator`
- `fcm`
- `attachments`
- `user_status`
- `chat_status`
- `visible`
- `first_name`
- `last_name`

Unknown or disallowed keys are rejected.

## Tests Added

Added [app/api/services/__tests__/user.updateEngineerAddress.test.js](/Users/appdev/dev/snatchi-next/app/api/services/__tests__/user.updateEngineerAddress.test.js) covering:
- engineer updates own address
- partial address update works
- location coordinates update works
- invalid ObjectId rejected
- guest blocked
- engineer blocked from updating another user
- disallowed fields ignored/rejected
- non-address fields unchanged
- invalid location coordinates rejected

## Notes

- no arbitrary field updates are allowed
- entire user document is never overwritten
- only `address.*` fields are updated
- mobile UI was not changed
