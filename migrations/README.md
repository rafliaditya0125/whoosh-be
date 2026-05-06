# Database Migrations

This directory contains all database migrations for the Whoosh Ticket App.

## Migration List

### Initial Schema (001-013)
1. `001_create_users.ts` - Users table
2. `002_create_stations.ts` - Stations table
3. `003_create_trains.ts` - Trains table
4. `004_create_schedules.ts` - Schedules table
5. `005_create_seats.ts` - Seats table
6. `006_create_bookings.ts` - Bookings table
7. `007_create_booking_passengers.ts` - Booking passengers table
8. `008_create_payments.ts` - Payments table
9. `009_create_tickets.ts` - Tickets table
10. `010_create_saved_passengers.ts` - Saved passengers table
11. `011_create_seat_locks.ts` - Seat locks table
12. `012_create_refunds_and_reschedule.ts` - Refunds and reschedule tables
13. `013_update_tickets_and_validations.ts` - Ticket validations table

### Bug Fixes (014+)
14. `014_fix_user_role_enum.ts` - **CRITICAL FIX**: Change user role enum from `['customer', 'admin']` to `['user', 'admin']` to match application code

## Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npx knex migrate:rollback

# Check migration status
npx knex migrate:status
```

## Important Notes

### Migration 014 - Role Enum Fix
**Problem:** There was an inconsistency between database schema and application code:
- Database enum: `['customer', 'admin']` with default `'customer'`
- Application code: Used `'user'` everywhere

**Solution:** Changed database enum to match application code:
- New enum: `['user', 'admin']` with default `'user'`
- Migrated existing `'customer'` values to `'user'`

**Impact:** This fixes the `WARN_DATA_TRUNCATED` error that occurred during user registration when trying to insert `role: 'user'` into a column that only accepted `'customer'` or `'admin'`.

## Migration Best Practices

1. **Never modify existing migrations** - Create new migrations instead
2. **Always provide `up()` and `down()` functions** for rollback capability
3. **Test migrations on development database first**
4. **Use transactions** for data migrations to ensure atomicity
5. **Document breaking changes** in this README
