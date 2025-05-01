# Course Recommendation Platform

A platform for ASU students to discover and bookmark online courses based on their interests, academic major, and desired skills. Built with Flask (backend) and Next.js (frontend).

## Features

- 👤 **User Authentication**
  - Sign up with major and skills selection
  - Secure login with password hashing
  - JWT-based session management

- 📚 **Course Discovery**
  - Browse courses from multiple platforms
  - Advanced filtering (major, difficulty, platform, price)
  - Course details with prerequisites and skills

- 🔖 **Bookmarking**
  - Save courses for later
  - Manage bookmarked courses
  - Quick access to saved content

- 🎯 **Skills Tracking**
  - Select skills to learn
  - Course recommendations based on skills
  - Track learning progress

## Tech Stack

- **Frontend:**
  - Next.js 13 with App Router
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components

- **Backend:**
  - Flask
  - PostgreSQL
  - JWT Authentication
  - psycopg2 for database access

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
    └── package.json       # Node.js dependencies
```

## Database Schema

- **Users & Authentication**
  - `user`: Base user information
  - `student`: Student-specific profile data
  - `asu_admin`: Admin user data

- **Course Management**
  - `course`: Course details
  - `platform`: Learning platforms
  - `course_prerequisite`: Prerequisites mapping

- **Skills & Bookmarks**
  - `skill`: Available skills
  - `user_skills`: User-skill associations
  - `course_skills`: Course-skill mapping
  - `bookmark`: User course bookmarks

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. Create and activate virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure database:
   - Create PostgreSQL database
   - Update `db_config.py` with your credentials
   ```python
   DB_CONFIG = {
       'dbname': 'phase3_db',
       'user': 'your_username',
       'password': 'your_password',
       'host': 'localhost',
       'port': '5432'
   }
   ```

4. Run the server:
   ```bash
   python application.py
   ```
   Server runs on http://localhost:5050

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: User login

### Courses
- `GET /api/courses`: List courses with filters
- `GET /api/courses/<id>`: Get course details
- `GET /api/platforms`: List platforms
- `GET /api/majors`: List available majors
- `GET /api/skills`: List available skills

### Bookmarks
- `GET /api/bookmarks`: Get user's bookmarks
- `POST /api/bookmarks`: Add bookmark
- `DELETE /api/bookmarks`: Remove bookmark

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Pending Features

- [ ] Skill-based course recommendations
- [ ] Admin dashboard and analytics
- [ ] Learning progress tracking
- [ ] Test coverage
- [ ] API documentation
- [ ] Deployment guide

## License

This project is part of CSE 412 at Arizona State University. 