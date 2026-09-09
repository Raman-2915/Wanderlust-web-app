# Wanderlust

A full-stack travel accommodation platform for discovering, creating, reviewing and managing property listings.

## Features

- User registration and login with Passport.js
- Session-based authentication with MongoDB session storage
- Listing CRUD with owner authorization
- Cloudinary image uploads
- Server-side Joi validation
- Search across title, location and country
- Country and price-range filters
- Sorting by newest, oldest and price
- Server-side pagination
- Reviews and ratings with author-level authorization
- Flash messages and centralized error handling
- Responsive EJS views using Bootstrap

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js, Passport Local Mongoose
- **Templating:** EJS, EJS-Mate
- **Image Storage:** Cloudinary, Multer
- **Validation:** Joi
- **Session Store:** connect-mongo

## Architecture

```text
Browser
   |
   v
Express Routes
   |
   v
Middleware / Authorization / Validation
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
middleware.js  # Authentication, authorization and validation
views/         # EJS templates
public/        # CSS and client-side JavaScript
utils/         # Error and async utilities
init/          # Database seed data
```

## Security Notes

- Secrets are stored in environment variables and `.env` is ignored by Git.
- Authenticated users are required for protected operations.
- Listing owners can modify or delete only their own listings.
- Review authors can delete only their own reviews.
- Uploaded images are restricted to JPG/PNG and limited to 5 MB.
- Session cookies use HTTP-only and production secure settings.
