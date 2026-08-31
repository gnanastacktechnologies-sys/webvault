# WebVault 🔒
> Personal Website Manager & Secure Bookmark Vault

WebVault is a secure, modern personal website bookmark and URL manager built using the MERN stack (MongoDB, Express, React, Node.js) with Tailwind CSS. It is designed to help professionals, developers, and power users organize their web links securely, search them instantly, and access them easily via a mobile-first responsive layout.

---

## 🌟 Key Features

* **Single Admin Portal**: Strictly locked administrative access with credential validation. No public sign-ups or registration leaks.
* **Database Seeding**: One-shot seeding script (`seed.js`) to bootstrap the administrator account and default curated categories.
* **Category Management (CRUD)**: Create, read, update, and delete folders with custom icons (React Icons) and curated colors.
* **Category Safety Triggers**: Prevents accidental bookmark deletions by blocking category deletions if they contain websites.
* **Website Management (CRUD)**: Create bookmarks with name, validation-checked URLs, tags, multi-line notes, and favorite stars.
* **Favorites Shelf**: Quick-star favorites from lists/cards and access them through a dedicated favorites filter.
* **Global Search Box**: Fast indexing searches matching name, URL, tags, categories, descriptions, and notes from any route.
* **DataTable component**: Desktop optimized tabular layout supporting:
  * Server-side pagination
  * Alphabetical sorting (including category name sorting via MongoDB aggregation)
  * Dynamic filters (Category and Star status)
* **Mobile-First Responsive Layout**: Sidebar collapses into an overlay drawer on mobile viewports; tables morph into touch-friendly cards.
* **Clipboard copy**: One-click URL copy with feedback toast notifications.
* **Favicon Sync**: Fetches icons with automated native globe fallbacks on load errors.

---

## 🛠️ Technology Stack

### Frontend
* **Core**: React.js (Vite, JavaScript ES modules)
* **Styling**: Tailwind CSS v4 & PostCSS (Curated design tokens)
* **Routing**: React Router v6
* **Icons**: React Icons (Fa library)
* **Charts**: Recharts (Dynamic category distribution)
* **HTTP Client**: Axios (with JWT interceptors)

### Backend
* **Core**: Node.js & Express.js
* **Database**: MongoDB (Mongoose schemas)
* **Auth**: JSON Web Tokens (JWT) & bcryptjs hashing
* **Security**: Helmet (HTTP security headers) & CORS configured origins

---

## 📂 Folder Structure

```text
webvault/
├── README.md
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Controller logic (Auth, Categories, Websites)
│   ├── middleware/      # Auth JWT filter & central error handler
│   ├── models/          # Mongoose Schemas (User, Category, Website)
│   ├── routes/          # Express route definitions
│   ├── server.js        # Server entry point
│   ├── seed.js          # Database seeding script
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/  # Forms, Layouts, Common UIs, DataTables
    │   ├── context/     # AuthContext, ToastContext
    │   ├── pages/       # Dashboard, Login, Categories, Websites
    │   ├── services/    # Centralized Axios API instances
    │   ├── App.jsx      # Router configuration
    │   └── main.jsx     # App entry
    └── tailwind.config.js
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory using the following keys:
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Local port the Express API listens on. | `5000` |
| `MONGODB_URI` | Connection string for MongoDB database instance. | `mongodb://127.0.0.1:27017/webvault` |
| `JWT_SECRET` | Secret key used to sign and verify authorization tokens. | `some_secure_secret_hash_key` |
| `CLIENT_URL` | Frontend URL allowed to bypass CORS policies. | `http://localhost:5173` |
| `ADMIN_USERNAME` | Username for the single administrator login. | `admin` |
| `ADMIN_PASSWORD` | Hashed password for the administrator account. | `adminpassword` |
| `NODE_ENV` | Running node environment. | `development` |

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint URL of the Express backend API. | `http://localhost:5000/api` |

---

## 🚀 Installation & Local Development

### 1. Prerequisite
Ensure you have **Node.js (v18+)** and **MongoDB** installed and running on your local machine.

### 2. Database Seeding
Open a terminal in the root directory, configure the `backend/.env` file, and seed the database:
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database seeder (Creates Admin user & default categories)
npm run seed
```

### 3. Running Backend Server
```bash
# Start backend server in development mode (using nodemon)
npm run dev
```
The server will connect and listen at `http://localhost:5000`.

### 4. Running Frontend Client
Open a new terminal window in the root directory:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite client dev server
npm run dev
```
Open your browser and navigate to the local link: `http://localhost:5173`.

---

## 📦 Production Build & Deployment

To build the client React application for production deployment:
```bash
cd frontend
npm run build
```
This generates an optimized static bundle in the `frontend/dist/` directory.

### Production Execution
* Serve the static assets inside `frontend/dist/` using a web server (e.g. Nginx, Vercel, or Netlify).
* Set `NODE_ENV=production` in the backend environment variables.
* Start the Express API in production using:
```bash
cd backend
npm start
```
