# Wanderlust

A full-stack travel accommodation platform for discovering, creating, reviewing, saving and booking property listings.

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

Base URL: `/api/v1`

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | API health check |
| GET | `/listings` | No | Search, filter, sort and paginate listings |
| GET | `/listings/:id` | No | Get a listing with confirmed booking intervals |
| POST | `/listings/:id/bookings` | Yes | Create a booking after availability validation |
| DELETE | `/bookings/:bookingId` | Yes | Cancel the authenticated user's booking |

Example listing query:

```text
GET /api/v1/listings?search=Delhi&sort=priceLow&page=1&limit=9
```

Example booking body:

```json
{
  "checkIn": "2026-10-10",
  "checkOut": "2026-10-13",
  "guests": 2
}
```

Protected API requests use the existing Passport session authentication. Unauthenticated API requests receive HTTP `401` JSON responses rather than browser redirects.

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

Run the API test suite with:

```bash
npm test
```

Additional commands:

```bash
npm run test:watch
npm run test:coverage
```

The current suite covers API health, paginated listing responses, missing-listing handling and JSON API error responses. Database calls are mocked so the API contract can be tested without requiring a live MongoDB connection.

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
init/          # Database seed data
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
