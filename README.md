# Theme Park Ticketing System

This is a Node.js/Express web application for a theme park ticketing system. It allows users to register, log in, view rides, purchase tickets (with optional fast-track rides), and manage their tickets. The app uses Firebase Authentication for user management and MongoDB for data storage.

## Features

- **User Registration & Login**: Secure authentication using Firebase.
- **View Rides**: Browse available rides and their fast-track prices.
- **Buy Tickets**: Purchase standard tickets and add fast-track rides.
- **Manage Tickets**: View, edit, and use your tickets.
- **Session Management**: Secure session cookies for authentication.
- **Error Handling**: Custom error pages for unauthorized access, not found, and server errors.
- **Sensitive Data in `.env`**: All secrets and credentials are now managed via environment variables.
- **Automatic Browser Launch**: The app opens in your browser automatically when started.

## Project Structure

```
index.js
package.json
.env
.env.example
db/
  connection.js
fb/
  firebase.js
public/
  js/
    login-script.js
    register-script.js
routes/
  rides.js
  users.js
views/
  401.ejs
  404.ejs
  500.ejs
  add-rides.ejs
  complete-order.ejs
  edit-ticket.ejs
  logged-in-rides.ejs
  login.ejs
  register.ejs
  start-order.ejs
  ticket-order.ejs
  view-rides.ejs
  view-tickets.ejs
  partials/
    links.html
    navbar.html
    user_nav.html
```

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- MongoDB Atlas account (or local MongoDB)
- Firebase project with service account credentials

### Installation

1. **Clone the repository**

   ```sh
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Set up environment variables**

   - Copy `.env.example` to `.env` and fill in your credentials:
     ```sh
     cp .env.example .env
     ```
   - Add your MongoDB, Firebase client, and Firebase Admin SDK credentials to `.env`.

4. **Remove `key.json`**

   - All Firebase Admin SDK credentials are now in `.env`. You no longer need `key.json`.

### Running the App

Start the server:

```sh
npm start
```

The app will open automatically in your default browser at [http://localhost:8080](http://localhost:8080).

## Usage

- Register and log in to access ticketing features.
- Browse rides, buy tickets, and manage your bookings.

## Environment Variables

All sensitive information is stored in the `.env` file.  
See `.env.example` for required variables:

- MongoDB connection details
- Firebase client config
- Firebase Admin SDK config
- Session secret

## Main Files

- [`index.js`](index.js): Main server entry point.
- [`routes/users.js`](routes/users.js): User authentication and ticket management.
- [`routes/rides.js`](routes/rides.js): Ride viewing endpoints.
- [`db/connection.js`](db/connection.js): MongoDB connection.
- [`fb/firebase.js`](fb/firebase.js): Firebase Admin SDK setup using environment variables.
- [`views/`](views/): EJS templates for UI.

## License

This project is licensed under the ISC License.

---

**Note:** This project is for educational purposes.  
**Never commit your real `.env` or any secrets to version control.**