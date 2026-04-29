# Whoosh Ticket App Backend

> [!WARNING]  
> **Disclaimer:** This project is strictly for **educational and portfolio purposes only**. It is not affiliated with, endorsed by, or connected to the official "Whoosh" High-Speed Railway or any related public entities in any way. All names, trademarks, and concepts belong to their respective owners.

A robust backend REST API for the Whoosh train ticket booking application built with Node.js, Express, TypeScript, and Knex.js.

## Features

- **Authentication & Authorization**: JWT-based authentication with `user` and `admin` roles.
- **User Profile Management**: Manage profiles and saved passenger lists.
- **Station & Train Management**: Admin-only routes to manage stations and trains.
- **Schedule Browsing**: Browse available train schedules with departure and arrival stations/times.
- **Secure Booking**: Book tickets with integrated passenger limitations, seat availability checks, and transactional database queries.
- **Payment Processing**: Bookings expire if not paid, mimicking a real-world flow.

## Requirements

Ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MariaDB](https://mariadb.org/) / MySQL (v8 or higher)
- [npm](https://www.npmjs.com/)

## Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repo-url>
   cd whoosh-be
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database**:
   Run the migrations and seeds (handled internally by `tsx` and Knex):
   ```bash
   npm run migrate
   npm run seed
   ```

## Available Scripts

- `npm run dev`: Starts the development server using `tsx`.
- `npm run build`: Compiles TypeScript source to JS in `dist/`.
- `npm run start`: Starts the production server from `dist/app.js`.
- `npm run lint`: Runs ESLint on the source files.
- `npm run lint:fix`: Automatically fixes ESLint warnings.
- `npm run test`: Runs the Jest unit tests.

## API Documentation

The full API Documentation is provided in `docs/API_Documentation.md`. Below is a brief summary of available endpoints:

### Authentication
- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate and receive a JWT.
- `GET /api/auth/me`: Get info about current decoded token.

### User & Passengers
- `GET /api/users/profile`: Show current user's profile.
- `PUT /api/users/profile`: Update user details.
- `GET /api/saved-passengers`: Fetch user's fast-booking passenger lists.

### Core Domain
- `GET /api/stations`: List active stations.
- `GET /api/trains`: List trains.
- `GET /api/schedules`: List available train schedules.
- `GET /api/seats/train/:trainId`: View seats.

### Secure Transactions
- `POST /api/bookings`: Create a new booking for a schedule containing passengers.
- `GET /api/bookings/my`: View all past/current bookings.
- `POST /api/payments/booking/:bookingId`: Pay an existing pending booking.

## Tech Stack
- Express
- TypeScript
- Knex.js
- Jest & Supertest
- TSX