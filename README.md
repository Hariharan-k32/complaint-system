# 🏛️ CitizenConnect — Smart Complaint & Service Request Management System

A full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) application for managing citizen complaints and service requests with real-time updates, analytics, role-based access control, and a modern professional UI.

---

## 📁 Project Structure

```
complaint-system/
├── backend/
│   ├── controllers/
│   │   ├── authController.js        # Register, login, profile, password
│   │   ├── complaintController.js   # Submit, track, assign, status update
│   │   ├── analyticsController.js   # Dashboard stats, trends
│   │   ├── notificationController.js # Notifications + Feedback
│   │   └── userController.js        # User CRUD + Departments
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + role authorize
│   │   ├── errorHandler.js          # Global error handler
│   │   └── upload.js                # Multer file upload config
│   ├── models/
│   │   ├── User.js                  # User schema + bcrypt + JWT
│   │   ├── Complaint.js             # Complaint schema + virtuals
│   │   └── index.js                 # Department, Notification, Feedback
│   ├── routes/
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   ├── users.js
│   │   ├── departments.js
│   │   ├── notifications.js
│   │   ├── feedback.js
│   │   └── analytics.js
│   ├── utils/
│   │   ├── logger.js                # Winston logger
│   │   ├── email.js                 # Nodemailer email utility
│   │   └── seeder.js                # Database seed script
│   ├── uploads/                     # File storage directory
│   ├── logs/                        # Application logs
│   ├── server.js                    # Express + Socket.io server
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Common/
│   │   │       ├── CitizenLayout.js  # Sidebar + layout for citizens
│   │   │       └── AdminLayout.js    # Sidebar + layout for admin/staff
│   │   ├── context/
│   │   │   ├── AuthContext.js        # Auth state + JWT management
│   │   │   └── SocketContext.js      # Socket.io real-time events
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── CitizenDashboard.js
│   │   │   ├── SubmitComplaint.js
│   │   │   ├── MyComplaints.js
│   │   │   ├── ComplaintDetail.js    # Shared: citizen view + admin controls
│   │   │   ├── TrackComplaint.js     # Public tracking page (no login)
│   │   │   ├── AdminDashboard.js     # Charts + recent complaints
│   │   │   ├── AdminComplaints.js    # Filter, search, quick status
│   │   │   ├── AdminUsers.js         # User management + edit modal
│   │   │   ├── AdminAnalytics.js     # Full analytics charts
│   │   │   ├── ProfilePage.js
│   │   │   └── NotFoundPage.js
│   │   ├── services/
│   │   │   └── api.js                # Axios instance + interceptors
│   │   ├── App.js                    # Routes + providers
│   │   ├── index.js
│   │   └── index.css                 # Design system CSS
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🗄️ MongoDB Collections

### Users
| Field | Type | Description |
|-------|------|-------------|
| name | String | Full name |
| email | String | Unique email |
| password | String | bcrypt hashed |
| role | Enum | citizen / staff / admin |
| phone | String | Contact number |
| address | Object | Street, city, state, zip |
| department | ObjectId | Ref to Department |
| isActive | Boolean | Account status |
| lastLogin | Date | Last login timestamp |

### Complaints
| Field | Type | Description |
|-------|------|-------------|
| ticketId | String | Auto-generated unique ticket |
| title | String | Brief complaint title |
| description | String | Detailed description |
| category | Enum | 10 category options |
| priority | Enum | Low / Medium / High / Urgent |
| status | Enum | Submitted → Under Review → In Progress → Resolved → Closed |
| location | Object | Address, city, state, coordinates |
| attachments | Array | File metadata |
| citizen | ObjectId | Ref to User |
| assignedTo | ObjectId | Ref to Staff User |
| department | ObjectId | Ref to Department |
| statusHistory | Array | Full audit trail |
| resolutionNote | String | Staff resolution notes |
| resolvedAt | Date | Resolution timestamp |

### Departments
| Field | Type | Description |
|-------|------|-------------|
| name | String | Department name |
| code | String | Short code (ROADS, WATER, etc.) |
| categories | Array | Complaint categories handled |
| head | ObjectId | Department head user |
| contactEmail | String | Contact email |

### Notifications
| Field | Type | Description |
|-------|------|-------------|
| recipient | ObjectId | Target user |
| type | Enum | complaint_submitted / status_updated / etc. |
| title | String | Notification heading |
| message | String | Full message |
| complaint | ObjectId | Related complaint |
| isRead | Boolean | Read status |

### Feedback
| Field | Type | Description |
|-------|------|-------------|
| complaint | ObjectId | Related complaint (unique) |
| citizen | ObjectId | Feedback author |
| rating | Number | 1–5 star rating |
| comment | String | Written feedback |
| categories | Object | Response time, staff behavior, quality |
| wouldRecommend | Boolean | Net promoter indicator |

---

## 🔌 API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new citizen |
| POST | `/login` | Public | Login + get JWT |
| GET | `/me` | Private | Get current user |
| PUT | `/profile` | Private | Update profile |
| PUT | `/password` | Private | Change password |
| POST | `/logout` | Private | Logout |

### Complaints (`/api/v1/complaints`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Citizen | Submit complaint (with file upload) |
| GET | `/my` | Citizen | Get own complaints |
| GET | `/` | Admin/Staff | Get all complaints (filterable) |
| GET | `/:id` | Private | Get single complaint |
| PATCH | `/:id/status` | Admin/Staff | Update complaint status |
| PATCH | `/:id/assign` | Admin | Assign to staff/department |
| DELETE | `/:id` | Admin | Delete complaint |
| GET | `/track/:ticketId` | Public | Track by ticket ID |

### Analytics (`/api/v1/analytics`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Admin/Staff | Full dashboard stats |
| GET | `/trends` | Admin/Staff | Daily trend data (7d/30d/90d) |

### Users (`/api/v1/users`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | List all users |
| GET | `/staff` | Admin | List staff for assignment |
| GET | `/:id` | Admin | Get single user |
| PUT | `/:id` | Admin | Update user |
| DELETE | `/:id` | Admin | Deactivate user |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get notifications |
| GET | `/unread-count` | Private | Get unread count |
| PATCH | `/:id/read` | Private | Mark one as read |
| PATCH | `/read-all` | Private | Mark all as read |

### Feedback (`/api/v1/feedback`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Citizen | Submit feedback |
| GET | `/` | Admin/Staff | Get all feedback |
| GET | `/complaint/:id` | Private | Get feedback for complaint |

### Departments (`/api/v1/departments`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | List departments |
| POST | `/` | Admin | Create department |
| PUT | `/:id` | Admin | Update department |
| DELETE | `/:id` | Admin | Deactivate department |

---

## 🔄 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `userId` | Join personal notification room |
| `join_admin` | `adminId` | Join admin broadcast room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_complaint` | `{ complaint }` | Admin: new complaint submitted |
| `complaint_submitted` | `{ complaint }` | Citizen: own complaint confirmed |
| `status_updated` | `{ complaintId, status, ticketId }` | Citizen: status changed |
| `complaint_assigned` | `{ complaint }` | Staff: new assignment |
| `complaint_updated` | `{ complaint }` | Admin: any update |

---

## 🚀 Setup & Run (Local Development)

### Prerequisites
- Node.js v18+ 
- MongoDB v6+ (local or Atlas)
- npm or yarn

### Step 1 — Clone and install

```bash
# Backend
cd complaint-system/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2 — Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and SMTP settings
```

Minimum required `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/complaint_system
JWT_SECRET=your_super_secret_min_32_characters_here
CLIENT_URL=http://localhost:3000
```

### Step 3 — Seed the database (optional)

```bash
cd backend
npm run seed
```

This creates:
- 5 departments
- 3 test accounts (admin, staff, citizen)
- 5 sample complaints

**Test credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@system.com | Password123! |
| Staff | staff@system.com | Password123! |
| Citizen | citizen@system.com | Password123! |

### Step 4 — Start the servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

### Step 5 — Access the app

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend app |
| http://localhost:5000/api/v1/health | Backend health check |
| http://localhost:3000/track | Public complaint tracker |

---

## 🐳 Docker Deployment

```bash
# From project root
docker-compose up --build -d

# Seed data
docker-compose exec backend npm run seed

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Services:
- **MongoDB**: `localhost:27017`
- **Backend API**: `localhost:5000`
- **Frontend**: `localhost:3000`

---

## ☁️ Cloud Deployment

### MongoDB Atlas
Replace `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/complaint_system
```

### Backend (Railway / Render / Heroku)
1. Push backend to git
2. Set environment variables from `.env.example`
3. Set start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL` to your deployed backend URL
2. Set `REACT_APP_SOCKET_URL` to the same backend URL
3. Build command: `npm run build`
4. Publish directory: `build`

---

## 🔒 Security Features

- **JWT Authentication** — Stateless token-based auth
- **bcrypt** — Password hashing (12 salt rounds)
- **Helmet.js** — HTTP security headers
- **Rate Limiting** — 200 requests / 15 minutes per IP
- **CORS** — Configurable origin whitelist
- **Role-Based Access Control** — citizen / staff / admin
- **Input Validation** — Mongoose schema validation
- **File Type Validation** — Multer mime type filtering

---

## 📊 Features Summary

### Citizen Portal
- ✅ Register & login
- ✅ Submit complaints with file attachments (drag & drop)
- ✅ Real-time status tracking
- ✅ View complaint history & timeline
- ✅ In-app notifications
- ✅ Public ticket tracker (no login required)
- ✅ Submit feedback/rating after resolution

### Admin/Staff Portal
- ✅ Full complaint management table with filters
- ✅ Quick status updates inline
- ✅ Assign complaints to staff + departments
- ✅ Real-time new complaint notifications
- ✅ Analytics dashboard with Chart.js
- ✅ 30-day trend charts
- ✅ User management with role control
- ✅ Department management

### System Features
- ✅ Socket.io real-time updates
- ✅ Auto-generated ticket IDs
- ✅ Full status history audit trail
- ✅ File upload with Multer
- ✅ Email notifications (Nodemailer)
- ✅ Winston logging
- ✅ Docker + Docker Compose
- ✅ MVC architecture
- ✅ REST API with pagination

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Chart.js, Socket.io Client |
| Styling | Custom CSS Design System (no framework required) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose ODM |
| Auth | JWT, bcryptjs |
| Real-time | Socket.io |
| File Upload | Multer |
| Email | Nodemailer |
| Logging | Winston |
| DevOps | Docker, Docker Compose, Nginx |
#   c o m p l a i n t - s y s t e m  
 