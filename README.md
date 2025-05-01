# Course Recommendation Platform

A platform for students to discover and bookmark online courses based on their interests and academic major. Built with Flask (backend) and Next.js (frontend).

## Project Structure

```
/
├── backend/               # Flask backend
│   ├── application.py     # Main server file
│   ├── auth.py            # Authentication endpoints
│   ├── db_config.py       # Database configuration
│   └── requirements.txt   # Python dependencies
│
└── frontend/              # Next.js frontend
    ├── src/               # Source code
    │   ├── app/           # Next.js App Router
    │   │   ├── auth/      # Authentication pages
    │   │   └── dashboard/ # User dashboard
    │   └── components/    # Reusable UI components
    ├── public/            # Static files
    └── package.json       # Node.js dependencies
```

## Backend Setup

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- pip (Python package manager)

### Database Setup

1. Create a PostgreSQL database: Follow (Instruction.sql)
   ```sql
   CREATE DATABASE phase3_db;
   ```

2. Update database configuration in `backend/db_config.py`:
   ```python
   DB_CONFIG = {
       'dbname': 'phase3_db',
       'user': 'your_username',  # Update with your database username
       'password': 'your_password', # Update with your database password
       'host': 'localhost',
       'port': '5432'
   }
   ```

3. Run the schema creation script or use the Flask API to initialize tables:
   ```bash
   # From database console
   psql -d phase3_db -f path/to/database_schema.sql
   
   # Or simply start the Flask app which will create tables
   python application.py
   ```

### Running the Backend

1. Create a virtual environment (recommended):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```bash
   python application.py
   ```

The backend will run on http://localhost:5050 by default.

## Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will run on http://localhost:3000.

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate a user

### Courses
- `GET /api/courses`: Get all courses
- `GET /api/courses/<course_id>`: Get specific course details

### Database Schema

The application uses the following tables:

- `user`: User information (students and admins)
- `student`: Student-specific profile data
- `asu_admin`: Admin-specific profile data
- `platform`: Course platforms (Coursera, Udemy, etc.)
- `course`: Course details including major categorization
- `course_prerequisite`: Course prerequisites relationships
- `bookmark`: User course bookmarks
- `skill`: Available skills in the system
- `user_skills`: Skills associated with users
- `course_skills`: Skills taught in courses

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Submit a pull request 