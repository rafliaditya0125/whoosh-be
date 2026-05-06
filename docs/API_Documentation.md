# API Documentation - Whoosh Ticket App

This documentation is updated based on the current implementation of the backend (v1.3.0).

**Version 1.3.0 Updates:**
- Fixed auth response schema inconsistency (login, register, me endpoints now use consistent User schema)
- Login and register now return full user object with all fields (user_id, full_name, email, phone, role)

**Version 1.2.0 Updates:**
- Added comprehensive error handling documentation
- User Error vs Server Error distinction
- Error response format with examples
- Reference code system for server errors
- Field-level validation error details

## Base URL: `/api`

## Authentication

All endpoints marked with 🔒 require JWT authentication via Bearer token in the Authorization header.

### 1. Authentication Endpoints

#### POST `/auth/register`
Register a new user.
- **Body**: `{ full_name, email, phone, password }`
- **Response**: 
  ```json
  {
    "message": "User berhasil terdaftar",
    "user": {
      "user_id": "1",
      "full_name": "Rafli Aditya",
      "email": "rafliaditya0125@gmail.com",
      "phone": "+6285173106273",
      "role": "user"
    }
  }
  ```

#### POST `/auth/login`
Login and get JWT token.
- **Body**: `{ email, password }`
- **Response**: 
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "1",
      "full_name": "Rafli Aditya",
      "email": "rafliaditya0125@gmail.com",
      "phone": "+6285173106273",
      "role": "user"
    }
  }
  ```

#### GET `/auth/me` 🔒
Get current user info.
- **Response**: 
  ```json
  {
    "user_id": "1",
    "full_name": "Rafli Aditya",
    "email": "rafliaditya0125@gmail.com",
    "phone": "+6285173106273",
    "role": "user"
  }
  ```

**Note:** All auth endpoints now use consistent User schema with fields: `user_id`, `full_name`, `email`, `phone`, `role`.

---

## 2. User & Profile Endpoints 🔒

#### GET `/users/profile`
Get user profile details.

#### PUT `/users/profile`
Update user profile.
- **Body**: `{ full_name?, email?, phone? }`

#### DELETE `/users/profile`
Delete user profile.

---

## 3. Saved Passengers Endpoints 🔒

#### GET `/saved-passengers`
Get list of saved passengers for the user.

#### POST `/saved-passengers`
Save a new passenger to user's list.
- **Body**: `{ full_name, id_number }`

#### DELETE `/saved-passengers/:id`
Delete a saved passenger.

---

## 4. Stations Endpoints

#### GET `/stations`
Get all available stations.

#### GET `/stations/:id`
Get details of a specific station.

#### POST `/stations` 🔒 (Admin Only)
Create a new station.
- **Body**: `{ station_name, location }`

#### PUT `/stations/:id` 🔒 (Admin Only)
Update station.

#### DELETE `/stations/:id` 🔒 (Admin Only)
Delete station.

---

## 5. Trains Endpoints

#### GET `/trains`
List all trains.

#### GET `/trains/:id`
Get train details.

#### POST `/trains` 🔒 (Admin Only)
Create a new train.
- **Body**: `{ train_name, train_code, total_seats }`

#### PUT `/trains/:id` 🔒 (Admin Only)
Update train.

#### DELETE `/trains/:id` 🔒 (Admin Only)
Delete train.

---

## 6. Seats Endpoints

### Seat Management (Admin)

#### GET `/seats/train/:trainId`
Get seats by train.

#### GET `/seats/train/:trainId/class/:class`
Get seats by train and class.

#### POST `/seats/train/:trainId` 🔒 (Admin Only)
Create a new seat.
- **Body**: `{ seat_number, class }`

#### DELETE `/seats/:id` 🔒 (Admin Only)
Delete a seat.

### Seat Locking (New Feature) 🔒

#### POST `/seats/lock`
Lock seats temporarily for booking process (10 minutes default).
- **Body**: 
  ```json
  {
    "schedule_id": "string",
    "seat_ids": ["seat1", "seat2"],
    "lock_duration": 600
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Seats locked successfully",
    "lock_id": "lock_abc123",
    "locked_seats": ["seat1", "seat2"],
    "expires_at": "2026-05-01T10:00:00Z"
  }
  ```

#### POST `/seats/unlock`
Unlock seats manually (e.g., user cancels booking).
- **Body**: `{ lock_id }`
- **Response**: `{ message: "Seats unlocked successfully" }`

#### GET `/seats/available`
Get available seats for a schedule.
- **Query Params**: `schedule_id` (required), `class` (optional: economy/business/vip)
- **Response**: 
  ```json
  {
    "schedule_id": "schedule123",
    "available_seats": [
      {
        "seat_id": "seat1",
        "seat_number": "A1",
        "class": "economy",
        "status": "available"
      }
    ]
  }
  ```

---

## 7. Schedules Endpoints

#### GET `/schedules`
List all schedules with optional filters.
- **Query Params**: `departure`, `arrival`, `date`

#### GET `/schedules/:id`
Get specific schedule details.

#### POST `/schedules` 🔒 (Admin Only)
Create a new schedule.
- **Body**: `{ train_id, departure_station, arrival_station, departure_time, arrival_time, price }`

---

## 8. Bookings Endpoints 🔒

#### POST `/bookings`
Create a new booking.
- **Body**: 
  ```json
  {
    "schedule_id": "string",
    "lock_id": "string (optional)",
    "passengers": [
      {
        "full_name": "John Doe",
        "id_number": "1234567890",
        "seat_id": "seat1 (optional)"
      }
    ]
  }
  ```

#### GET `/bookings/my`
Get user's bookings with full details (nested schedule, stations, train, passengers, seats, payment, ticket).
- **Query Param**: `type` (optional: `unpaid`, `paid`, `history`)
- **Response**: 
  ```json
  {
    "items": [
      {
        "booking_id": "booking_123",
        "booking_code": "WOOSH-ABCD1234",
        "status": "paid",
        "total_price": 500000,
        "created_at": "2026-05-01T08:00:00Z",
        "schedule": {
          "schedule_id": "schedule_456",
          "departure_station": {
            "station_id": "station_jkt",
            "station_name": "Jakarta",
            "location": "Jakarta"
          },
          "arrival_station": {
            "station_id": "station_bdg",
            "station_name": "Bandung",
            "location": "Bandung"
          },
          "departure_time": "2026-05-10T10:00:00Z",
          "arrival_time": "2026-05-10T11:00:00Z",
          "train": {
            "train_id": "train_001",
            "train_name": "Whoosh Express",
            "train_code": "WHS-01"
          },
          "price": 250000
        },
        "passengers": [
          {
            "full_name": "John Doe",
            "id_number": "1234567890",
            "seat": {
              "seat_id": "seat_A1",
              "seat_number": "A1",
              "class": "economy"
            }
          }
        ],
        "payment": {
          "payment_id": "payment_789",
          "status": "paid",
          "method": "qris",
          "paid_at": "2026-05-01T08:10:00Z"
        },
        "ticket": {
          "ticket_id": "ticket_001",
          "qr_code_url": "/api/tickets/ticket_001/qr",
          "qr_data": "ENC:abc123..."
        }
      }
    ]
  }
  ```

#### GET `/bookings/:id`
Get booking detail by ID (same structure as items in `/bookings/my`).

#### POST `/bookings/:id/cancel`
Cancel a booking.

### Reschedule & Refund (New Features)

#### POST `/bookings/:id/reschedule`
Reschedule booking to different schedule.
- **Body**: 
  ```json
  {
    "new_schedule_id": "schedule456",
    "reason": "Change of plans (optional)"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Booking rescheduled successfully",
    "booking_id": "booking123",
    "old_schedule_id": "schedule123",
    "new_schedule_id": "schedule456",
    "price_difference": 50000,
    "reschedule_fee": 25000,
    "total_payment": 75000
  }
  ```

#### POST `/bookings/:id/refund`
Request refund for paid booking.
- **Body**: 
  ```json
  {
    "reason": "Cannot attend",
    "bank_account": {
      "bank_name": "BCA",
      "account_number": "1234567890",
      "account_name": "John Doe"
    }
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Refund request submitted successfully",
    "refund_id": "refund123",
    "booking_id": "booking123",
    "refund_amount": 450000,
    "cancellation_fee": 50000,
    "original_amount": 500000,
    "estimated_refund_date": "2026-05-07",
    "status": "pending"
  }
  ```

#### GET `/bookings/refunds/:id`
Get refund request status.
- **Response**: 
  ```json
  {
    "refund_id": "refund123",
    "booking_id": "booking123",
    "status": "pending",
    "refund_amount": 450000,
    "requested_at": "2026-04-30T08:00:00Z",
    "processed_at": null,
    "notes": "Refund request is being processed"
  }
  ```

---

## 9. Payments Endpoints 🔒

#### POST `/payments/booking/:bookingId`
Process payment for a booking.
- **Body**: 
  ```json
  {
    "payment_method_id": "qris",
    "channel_code": "BCA (optional)",
    "amount": 500000
  }
  ```
  Note: `payment_method` is deprecated, use `payment_method_id` instead.
- **Response**: 
  ```json
  {
    "payment_id": "payment_789",
    "booking_id": "booking_123",
    "status": "pending",
    "amount": 500000,
    "payment_method": "qris",
    "channel_code": "BCA"
  }
  ```

#### GET `/payments/:paymentId` (New Feature)
Get payment status for tracking.
- **Response**: 
  ```json
  {
    "payment_id": "payment_789",
    "booking_id": "booking_123",
    "status": "paid",
    "amount": 500000,
    "payment_method": "qris",
    "created_at": "2026-05-01T08:00:00Z",
    "updated_at": "2026-05-01T08:10:00Z"
  }
  ```

#### PUT `/payments/:paymentId/status`
Update payment status.
- **Body**: `{ payment_status }`

---

## 10. Tickets Endpoints 🔒 (New Feature)

#### GET `/tickets/:id/qr`
Get QR code for ticket.
- **Response**: 
  ```json
  {
    "ticket_id": "ticket123",
    "booking_code": "WOOSH123",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "qr_data": "ENC:abc123def456...",
    "expires_at": "2026-05-01T10:00:00Z",
    "status": "valid"
  }
  ```

#### POST `/tickets/validate`
Validate QR code at check-in (used by station staff).
- **Body**: 
  ```json
  {
    "qr_data": "ENC:abc123def456...",
    "station_id": "station123",
    "validator_id": "staff123 (optional)"
  }
  ```
- **Response**: 
  ```json
  {
    "valid": true,
    "ticket_id": "ticket123",
    "booking_code": "WOOSH123",
    "passenger": {
      "name": "John Doe",
      "id_number": "1234567890"
    },
    "schedule": {
      "train_name": "Whoosh Express",
      "departure_station": "Jakarta",
      "arrival_station": "Bandung",
      "departure_time": "2026-05-01T10:00:00Z",
      "seat_number": "A1",
      "class": "economy"
    },
    "validated_at": "2026-05-01T09:45:00Z",
    "status": "checked_in"
  }
  ```

---

## Status Codes & Error Handling

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request / Validation Error (User Error)
- **401**: Unauthorized - missing or invalid token (User Error)
- **403**: Forbidden - insufficient permissions (User Error)
- **404**: Not Found (User Error)
- **409**: Conflict - e.g., seat already booked, duplicate entry (User Error)
- **422**: Unprocessable Entity - business logic violation (User Error)
- **500**: Internal Server Error (Server Error - WITH reference code)

### Error Response Format

#### User Error (Client-side Error)
Caused by user input/action mistakes. **NEVER uses status code 500**.

```json
{
  "error": "Format nomor telepon salah. Nomor telepon wajib diawali +62 (contoh: +628123456789)",
  "code": "INVALID_PHONE_FORMAT",
  "statusCode": 400,
  "details": {
    "fields": {
      "phone": "Format salah, wajib diawali +62"
    }
  }
}
```

**Characteristics:**
- ❌ NO reference code
- ✅ Specific, actionable error message in Indonesian
- ✅ Status codes: 400, 401, 403, 404, 409, 422
- ✅ Optional `details.fields` for field-level validation errors

#### Server Error (Server-side Error)
Caused by server/config issues. **CAN use status code 500 WITH reference code**.

```json
{
  "error": "Terjadi kesalahan database saat registrasi user. Silakan coba lagi atau hubungi support dengan kode error: 1001",
  "code": "DATABASE_QUERY_ERROR",
  "statusCode": 500,
  "referenceCode": 1001,
  "details": {
    "operation": "create_user",
    "error": "ER_LOCK_WAIT_TIMEOUT"
  }
}
```

**Characteristics:**
- ✅ MUST have reference code (format: `ERR-YYYYMMDD-HHMMSS-XXXX`)
- ✅ Generic message directing user to contact support
- ✅ Status code: 500
- ✅ Reference code is logged with full details for debugging

### Common Error Codes

#### User Error Codes (400, 401, 403, 404, 409, 422)

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | General validation error |
| `INVALID_EMAIL_FORMAT` | 400 | Email format is invalid |
| `INVALID_PHONE_FORMAT` | 400 | Phone must start with +62 |
| `PASSWORD_TOO_SHORT` | 400 | Password must be at least 8 characters |
| `INVALID_QR_CODE` | 400 | QR code is invalid or expired |
| `INVALID_CREDENTIALS` | 401 | Email or password is wrong |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `TOKEN_EXPIRED` | 401 | Authentication token has expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `ADMIN_ONLY` | 403 | Admin privileges required |
| `NOT_FOUND` | 404 | Resource not found |
| `USER_NOT_FOUND` | 404 | User not found |
| `BOOKING_NOT_FOUND` | 404 | Booking not found |
| `PAYMENT_NOT_FOUND` | 404 | Payment not found |
| `SCHEDULE_NOT_FOUND` | 404 | Schedule not found |
| `EMAIL_ALREADY_EXISTS` | 409 | Email already registered |
| `PHONE_ALREADY_EXISTS` | 409 | Phone already registered |
| `SEAT_ALREADY_BOOKED` | 409 | Seat is already booked |
| `SEAT_LOCKED` | 409 | Seat is locked by another user |
| `NO_SEATS_AVAILABLE` | 422 | No seats available for schedule |
| `CANNOT_CANCEL_PAID_BOOKING` | 422 | Cannot cancel paid booking |
| `CANNOT_REFUND_UNPAID_BOOKING` | 422 | Cannot refund unpaid booking |
| `TICKET_ALREADY_USED` | 422 | Ticket has been used |
| `TICKET_EXPIRED` | 422 | Ticket has expired |
| `SEAT_LOCK_EXPIRED` | 422 | Seat lock has expired |
| `INVALID_STATE_TRANSITION` | 422 | Invalid state transition |

#### Server Error Codes (500)

| Code | Status | Description |
|------|--------|-------------|
| `DATABASE_CONNECTION_ERROR` | 500 | Cannot connect to database |
| `DATABASE_QUERY_ERROR` | 500 | Database query failed |
| `DATABASE_TIMEOUT` | 500 | Database operation timeout |
| `EXTERNAL_SERVICE_ERROR` | 500 | External service error |
| `PAYMENT_GATEWAY_ERROR` | 500 | Payment gateway error |
| `CONFIGURATION_ERROR` | 500 | Server configuration error |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |

### Error Examples by Endpoint

#### POST `/auth/register`

**400 - Invalid Phone Format (User Error)**
```json
{
  "error": "Format nomor telepon salah. Nomor telepon wajib diawali +62 (contoh: +628123456789)",
  "code": "INVALID_PHONE_FORMAT",
  "statusCode": 400,
  "details": {
    "fields": {
      "phone": "Format salah, wajib diawali +62"
    }
  }
}
```

**409 - Email Already Exists (User Error)**
```json
{
  "error": "Email sudah terdaftar. Silakan gunakan email lain atau login",
  "code": "EMAIL_ALREADY_EXISTS",
  "statusCode": 409
}
```

**500 - Database Error (Server Error)**
```json
{
  "error": "Terjadi kesalahan database saat registrasi user. Silakan coba lagi atau hubungi support dengan reference code",
  "code": "DATABASE_QUERY_ERROR",
  "statusCode": 500,
  "referenceCode": 1001
}
```

#### POST `/auth/login`

**401 - Invalid Credentials (User Error)**
```json
{
  "error": "Email atau password salah. Silakan periksa kredensial Anda dan coba lagi",
  "code": "INVALID_CREDENTIALS",
  "statusCode": 401
}
```

#### POST `/seats/lock`

**409 - Seat Locked (User Error)**
```json
{
  "error": "Kursi A1 sedang di-lock oleh user lain. Lock akan expire pada 2026-05-06T14:00:00.000Z. Silakan pilih kursi lain atau coba lagi nanti",
  "code": "SEAT_LOCKED",
  "statusCode": 409
}
```

**409 - Seat Already Booked (User Error)**
```json
{
  "error": "Kursi A1 sudah dibooking. Silakan pilih kursi lain",
  "code": "SEAT_ALREADY_BOOKED",
  "statusCode": 409
}
```

#### POST `/bookings`

**404 - Schedule Not Found (User Error)**
```json
{
  "error": "Schedule dengan identifier 'schedule123' tidak ditemukan",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

**422 - No Seats Available (User Error)**
```json
{
  "error": "Tidak ada kursi tersedia untuk jadwal ini. Silakan pilih jadwal atau kelas lain",
  "code": "NO_SEATS_AVAILABLE",
  "statusCode": 422
}
```

**422 - Seat Lock Expired (User Error)**
```json
{
  "error": "Lock ID tidak valid atau sudah expired. Silakan lock kursi kembali",
  "code": "SEAT_LOCK_EXPIRED",
  "statusCode": 422
}
```

#### POST `/bookings/:id/cancel`

**422 - Cannot Cancel Paid Booking (User Error)**
```json
{
  "error": "Tidak dapat membatalkan booking: Status booking adalah \"paid\". Hanya booking dengan status \"pending\" yang dapat dibatalkan. Silakan ajukan refund",
  "code": "CANNOT_CANCEL_PAID_BOOKING",
  "statusCode": 422
}
```

#### POST `/bookings/:id/refund`

**422 - Cannot Refund Unpaid Booking (User Error)**
```json
{
  "error": "Tidak dapat refund booking: Booking belum dibayar. Hanya booking yang sudah dibayar yang dapat di-refund",
  "code": "CANNOT_REFUND_UNPAID_BOOKING",
  "statusCode": 422
}
```

#### POST `/tickets/validate`

**400 - Invalid QR Code (User Error)**
```json
{
  "error": "QR code tidak valid: QR code sudah expired. Silakan generate QR code baru",
  "code": "INVALID_QR_CODE",
  "statusCode": 400
}
```

**422 - Ticket Already Used (User Error)**
```json
{
  "error": "Tiket sudah digunakan untuk check-in. Setiap tiket hanya dapat digunakan sekali",
  "code": "TICKET_ALREADY_USED",
  "statusCode": 422
}
```

**422 - Ticket Expired (User Error)**
```json
{
  "error": "Tiket sudah expired. Waktu keberangkatan sudah lewat",
  "code": "TICKET_EXPIRED",
  "statusCode": 422
}
```

### Error Handling Best Practices

1. **Always check `statusCode` and `code` fields** for programmatic error handling
2. **Display `error` message to users** - it's in Indonesian and actionable
3. **For validation errors (400)**, check `details.fields` for field-level errors
4. **For server errors (500)**, show the `referenceCode` to users so they can report it to support
5. **Never retry server errors automatically** - they need manual intervention
6. **User errors can be retried** after user fixes the input

### Example Error Handling (Mobile/Frontend)

```javascript
try {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // User Error (400, 401, 403, 404, 409, 422)
    if (error.statusCode < 500) {
      // Show error message to user
      alert(error.error);
      
      // Handle field-level validation errors
      if (error.details?.fields) {
        Object.entries(error.details.fields).forEach(([field, message]) => {
          showFieldError(field, message);
        });
      }
    }
    // Server Error (500)
    else if (error.statusCode === 500) {
      // Show generic error with reference code
      alert(`Terjadi kesalahan server. Silakan hubungi support dengan kode: ${error.referenceCode}`);
      
      // Log for debugging
      console.error('Server Error:', error);
    }
  }
} catch (err) {
  // Network error
  alert('Tidak dapat terhubung ke server. Periksa koneksi internet Anda');
}
```

---

## Notes

### New Features (v1.1.0)
1. **Seat Locking**: Lock seats temporarily during booking process
2. **Reschedule & Refund**: Request reschedule or refund for bookings
3. **QR Code**: Generate and validate QR codes for tickets
4. **Payment Status**: Track payment status with dedicated endpoint
5. **Enhanced Booking Response**: Nested data structure with full details

### Mobile Integration
- Use `payment_method_id` instead of `payment_method` for payment requests
- `GET /bookings/my` returns `{ items: [...] }` format for consistency
- All booking responses include nested schedule, stations, train, passengers, seats, payment, and ticket data
- QR code data is encrypted for security

---

## Changelog

### v1.3.0 (06-05-2026)
- **Fixed:** Auth response schema inconsistency
  - `/auth/login` now returns full user object (user_id, full_name, email, phone, role)
  - `/auth/register` now returns full user object instead of just user_id
  - All auth endpoints use consistent User schema

### v1.2.0 (05-05-2026)
- Added comprehensive error handling documentation
- User Error vs Server Error distinction
- Reference code system for server errors

### v1.1.0 (30-04-2026)
- Added seat locking mechanism
- Added reschedule & refund endpoints
- Added QR code generation & validation
- Added payment status tracking endpoint

---

*Generated and updated: 06-05-2026 (v1.3.0 - Fixed auth response schema inconsistency)*
