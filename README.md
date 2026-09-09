# Wanderlust

A full-stack travel accommodation platform for discovering, creating, reviewing, saving and booking property listings.

[![CI](https://github.com/Raman-2915/Wanderlust-web-app/actions/workflows/ci.yml/badge.svg?branch=resume-upgrade)](https://github.com/Raman-2915/Wanderlust-web-app/actions/workflows/ci.yml)

## Live Demo

**Production:** https://wanderlust-lqkv.onrender.com

> The live application requires the configured production environment variables. API base path: `https://wanderlust-lqkv.onrender.com/api/v1`

## Screenshots

### Home & Listing Discovery

![Wanderlust home page](screenshots/home.png)

### Listing Details & Booking

![Listing details and booking](screenshots/listing-details.png)

### User Dashboard

![User dashboard](screenshots/dashboard.png)

> **Screenshot setup:** Add your actual application screenshots to `screenshots/home.png`, `screenshots/listing-details.png`, and `screenshots/dashboard.png`. The README is intentionally wired to these stable paths so the documentation can be updated without changing the sections below.

## Features

- User registration and login with Passport.js
- Session-based authentication with MongoDB session storage
- User dashboard with listings, wishlist, reviews and bookings
- Persistent wishlist/favorites using MongoDB atomic `$addToSet` / `$pull` operations
- Listing CRUD with owner authorization
- Cloudinary image uploads
- Server-side Joi validation
- Search across title, location and country
- Country and price-range filters
- Sorting by newest, oldest and price
- Server-side pagination
- Reviews and ratings with author-level authorization
- Booking workflow with check-in/check-out dates and guest count
- Server-side booking conflict detection using date-overlap queries
- Booking cancellation for the authenticated guest
- Automatic total-price calculation based on number of nights
- REST API for listing discovery, availability and bookings
- JSON authentication errors for protected API routes
- Lightweight API rate limiting with `Retry-After` responses
- Automated API tests with Jest and Supertest
- Flash messages and centralized error handling
- Responsive EJS views using Bootstrap

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js, Passport Local Mongoose
- **Templating:** EJS, EJS-Mate
- **Image Storage:** Cloudinary, Multer
- **Validation:** Joi + Mongoose
- **Session Store:** connect-mongo
- **API Testing:** Jest, Supertest
- **CI:** GitHub Actions
- **Deployment:** Render

## Architecture

```text
Browser / API Client
        |
        v
Express Routes
        |
        v
Middleware / Authorization / Rate Limiting
        |
        v
Controllers
        |
        v
Mongoose Models
        |
        v
MongoDB Atlas
```

The application follows an MVC-style structure with separate routes, controllers, models, middleware, utilities and views.

## REST API

### Base URL

```text
https://wanderlust-lqkv.onrender.com/api/v1
```

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | API health check |
| GET | `/listings` | No | Search, filter, sort and paginate listings |
| GET | `/listings/:id` | No | Get a listing with confirmed booking intervals |
| POST | `/listings/:id/bookings` | Yes | Create a booking after availability validation |
| DELETE | `/bookings/:bookingId` | Yes | Cancel the authenticated user's booking |

### Health Check

```bash
curl https://wanderlust-lqkv.onrender.com/api/v1/health
```

Example response:

```json
{
  "success": true,
  "message": "Wanderlust API is running"
}
```

### Search, Filter, Sort & Pagination

```http
GET /api/v1/listings?search=Delhi&country=India&sort=priceLow&page=1&limit=9
```

Supported `sort` values:

- `newest`
- `oldest`
- `priceLow`
- `priceHigh`

Example response shape:

```json
{
  "success": true,
  "data": [
    {
      "title": "Cozy Delhi Stay",
      "price": 2500,
      "location": "Delhi",
      "country": "India"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 9,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Listing Availability

```http
GET /api/v1/listings/:id
```

The response contains the listing data plus confirmed future booking intervals under `availability`.

### Create Booking

Authentication is required through the application's Passport session.

```http
POST /api/v1/listings/:id/bookings
Content-Type: application/json
```

Request body:

```json
{
  "booking": {
    "checkIn": "2026-10-10",
    "checkOut": "2026-10-13",
    "guests": 2
  }
}
```

Possible responses:

- `201 Created` — booking created successfully
- `400 Bad Request` — invalid dates or guest count
- `401 Unauthorized` — authentication required
- `403 Forbidden` — user attempted to book their own listing
- `409 Conflict` — requested dates overlap an existing confirmed booking

### Cancel Booking

```http
DELETE /api/v1/bookings/:bookingId
```

Only the authenticated guest who owns the booking can cancel it.

### API Error Format

Protected API requests return JSON instead of redirecting to the login page:

```json
{
  "success": false,
  "message": "Authentication required"
}
```

The API has a lightweight per-IP request limit of 100 requests per minute. When the limit is exceeded, the API responds with HTTP `429` and a `Retry-After` header.

## Booking Logic

Bookings use a half-open date interval: `[checkIn, checkOut)`.

A new booking is rejected when an existing confirmed booking overlaps it:

```text
existing.checkIn < requested.checkOut
AND
existing.checkOut > requested.checkIn
```

This allows a guest to check in on the same date another guest checks out while preventing overlapping stays.

## Automated Testing

Run the test suite with:

```bash
npm test
```

Additional commands:

```bash
npm run test:watch
npm run test:coverage
```

The automated suite covers API health, listing discovery, missing-listing handling, protected booking/cancellation routes and JSON API errors. Database-dependent calls are mocked in the API contract tests, so the suite does not require a production MongoDB connection.

## Continuous Integration

GitHub Actions runs the automated test suite on pushes to `main` and `resume-upgrade`, and on pull requests targeting `main`.

The CI workflow uses Node.js `20.17.0`, installs dependencies from `package-lock.json`, and runs `npm test`.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Raman-2915/Wanderlust-web-app.git
cd Wanderlust-web-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
ATLASDB_URL=your_mongodb_connection_string
SECRET=your_session_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

### 4. Start the application

```bash
npm start
```

The server uses `PORT` when supplied by the deployment environment and falls back to port `8080` locally.

## Live Deployment — Render

The application is designed to run as a Node.js web service on Render.

### Build configuration

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Node.js:** `20.17.0` via the `engines` field in `package.json`

### Required environment variables

Configure these variables in the Render service settings:

```text
ATLASDB_URL
SECRET
CLOUD_NAME
CLOUD_API_KEY
CLOUD_API_SECRET
```

Render automatically provides `PORT`; the application reads `process.env.PORT` and falls back to `8080` for local development.

### Deployment checklist

1. Push the `resume-upgrade` branch or merge the completed changes into `main`.
2. Create/connect a Render Web Service for the GitHub repository.
3. Set the build command to `npm install`.
4. Set the start command to `npm start`.
5. Add the required environment variables.
6. Deploy the service.
7. Verify the health endpoint:

```text
https://wanderlust-lqkv.onrender.com/api/v1/health
```

8. Verify the browser application and a complete booking flow after deployment.

> Never commit `.env` or production secrets to GitHub.

## Project Structure

```text
controllers/   # Request/business logic
models/        # Mongoose schemas
routes/        # Express routes
middleware.js  # Browser authentication/authorization/validation
views/         # EJS templates
public/        # CSS and client-side JavaScript
utils/         # Error and async utilities
middleware/    # API authentication and rate limiting
tests/         # Automated API tests
screenshots/   # README screenshots
init/          # Database seed data
.github/       # GitHub Actions CI
```

## Security Notes

- Secrets are stored in environment variables and `.env` is ignored by Git.
- Authenticated users are required for protected operations.
- Listing owners can modify or delete only their own listings.
- Review authors can delete only their own reviews.
- Booking cancellation is restricted to the authenticated booking guest.
- Users cannot book their own listings.
- Uploaded images are restricted to JPG/PNG and limited to 5 MB.
- Session cookies use HTTP-only and production secure settings.
- API routes have authentication checks and rate limiting.

## Future Improvements

- Payment integration
- Email booking confirmations
- Advanced availability calendar
- Role-based admin dashboard
- Automated end-to-end browser tests
