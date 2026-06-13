# ConnectHub Backend 🚀

A modern, scalable Node.js/Express backend API for the ConnectHub MERN stack social networking application. Features secure JWT authentication, bcrypt password hashing, and MongoDB data persistence.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: dotenv

## Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup & MongoDB connection
│   ├── config/
│   │   └── db.js              # Database connection logic
│   ├── controllers/
│   │   ├── authController.js  # Auth logic (register, login)
│   │   └── userController.js  # User CRUD operations
│   ├── models/
│   │   └── User.js            # User schema & model
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   └── users.js           # User routes
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── utils/
│       └── jwt.js             # JWT token generation & verification
├── package.json               # Dependencies & scripts
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore file
└── README.md                  # This file
```

## Prerequisites

Before you get started, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - Either [local installation](https://docs.mongodb.com/manual/installation/) or [MongoDB Atlas cloud](https://www.mongodb.com/cloud/atlas) (recommended)
- **Git** (optional but recommended)

Verify installations:
```bash
node --version
npm --version
```

## Installation & Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variable management
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `nodemon` (dev) - Auto-reload during development

### Step 3: Configure Environment Variables

1. Create a `.env` file by copying the template:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/connecthub
   JWT_SECRET=your-super-secret-key-change-in-production
   JWT_EXPIRY=7d
   ```

3. **MongoDB Setup**:
   - **Local MongoDB**: Install locally and ensure `mongod` is running
   - **MongoDB Atlas** (Cloud - Recommended):
     1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     2. Create a free cluster
     3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/connecthub`
     4. Update `MONGODB_URI` in `.env`

### Step 4: Start the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

Expected output:
```
✅ Connected to MongoDB successfully
🚀 Server is running on http://localhost:5000
📡 Environment: development
```

#### Production Mode:
```bash
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### User Routes (`/api/users`)

**Note**: All user routes require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

#### Get All Users
```http
GET /api/users
```

#### Get Current User
```http
GET /api/users/me
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Update User Profile
```http
PUT /api/users/:id
Content-Type: application/json

{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

#### Delete User
```http
DELETE /api/users/:id
```

#### Health Check
```http
GET /api/health
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment type | development / production |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/connecthub |
| `JWT_SECRET` | Secret key for JWT signing | your-secret-key |
| `JWT_EXPIRY` | Token expiration time | 7d, 24h |
| `CORS_ORIGIN` | Frontend URL for CORS | http://localhost:3000 |

## Common Issues & Solutions

### ❌ MongoDB Connection Error
**Problem**: `MongoDB connection error: connect ECONNREFUSED`

**Solution**:
- Ensure MongoDB is running (`mongod` command)
- Check `MONGODB_URI` is correct
- For Atlas, verify IP whitelist includes your IP

### ❌ Port Already in Use
**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Kill process on port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env file
PORT=5001
```

### ❌ JWT Token Invalid
**Problem**: `Invalid or expired token` error

**Solution**:
- Ensure token is sent in header: `Authorization: Bearer <token>`
- Check token hasn't expired
- Verify `JWT_SECRET` matches on server

## Development Tools

### Useful npm Scripts
```bash
npm run dev      # Start with nodemon (development)
npm start        # Start production server
npm test         # Run tests (if configured)
```

### Testing with Postman/Insomnia
1. Download [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/)
2. Import API endpoints
3. For protected routes, add token to `Authorization` header
4. Test endpoints

## Git Workflow

```bash
# Check git status
git status

# Stage changes
git add .

# Commit changes
git commit -m "feat: add user authentication"

# Push to remote
git push origin main
```

## Next Steps

1. **Frontend Integration**: Connect this backend to your React frontend
2. **Database Seeding**: Create seed data for development
3. **API Testing**: Write unit tests with Jest
4. **Error Handling**: Implement global error handling middleware
5. **Rate Limiting**: Add rate limiting for security
6. **Logging**: Implement structured logging (Winston, Morgan)
7. **Email Verification**: Add email confirmation on registration
8. **Password Reset**: Implement forgot password flow

## Deployment

### Deploy to Heroku
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create connecthub-backend

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main
```

## Support & Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## License

MIT License - feel free to use this project for personal or commercial purposes.