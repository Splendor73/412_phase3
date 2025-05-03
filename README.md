# Course Recommendation Platform

# Quick Start Guide: Running Locally

This step-by-step guide will help you set up and run the application on your local machine.

## System Requirements
- **PostgreSQL 12+** installed and running
- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **Google Chrome** installed (for web scraping functionality)
- **Git** for cloning the repository

## Step 1: Clone the Repository
```bash
git clone https://github.com/Splendor73/412_phase3.git
cd 412_phase3
```

## Step 2: Set Up the Database
1. Navigate into the [database_setup](./database_setup/) directory:
```bash
cd database_setup
```

2. Start PostgreSQL and create a new database. Note down your PostgreSQL username and password.
```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE phase3_db_group19;

# Connect to the database
\c phase3_db_group19;
```

3. Run the SQL code from [setup.sql](./database_setup/setup.sql) to create the tables:

```bash
 \i setup.sql;
```

4. Run the following commands in order to import the DB dump from [/database_setup/dump](./database_setup/dump/):
```bash
\copy "user"(user_id, first_name, last_name, email, password, type, date_created) FROM './dump/user.csv' DELIMITER '|' CSV HEADER;

\copy student(user_id, major, skill_level) FROM './dump/student.csv' DELIMITER '|' CSV HEADER;

\copy asu_admin(user_id, department, job_title) FROM './dump/asu_admin.csv' DELIMITER '|' CSV HEADER;

\copy platform(platform_id, name, website) FROM './dump/platform.csv' DELIMITER '|' CSV HEADER;

\copy institution(institution_id, name) FROM './dump/institution.csv' DELIMITER '|' CSV HEADER;

\copy course(course_id, title, description, difficulty, platform_id, institution_id, rating, url, num_enrollments) FROM './dump/course.csv' DELIMITER '|' CSV HEADER;

\copy course_prerequisite(course_id, prerequisite_course_id) FROM './dump/course_prerequisite.csv' DELIMITER '|' CSV HEADER;

\copy bookmark(user_id, course_id, date_created) FROM './dump/bookmark.csv' DELIMITER '|' CSV HEADER;

\copy skill(skill_id, name) FROM './dump/skill.csv' DELIMITER '|' CSV HEADER;

\copy user_skills(user_id, skill_id) FROM './dump/user_skills.csv' DELIMITER '|' CSV HEADER;

\copy course_skills(course_id, skill_id) FROM './dump/course_skills.csv' DELIMITER '|' CSV HEADER;
```

## Step 3: Configure the Backend
1. Navigate to the backend directory:
```bash
cd ../backend
```

2. Create and activate a Python virtual environment:
```bash
# On macOS/Linux
python -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

3. Install required Python packages:
```bash
pip install -r requirements.txt
```

4. Configure the database connection:
   - Open `db_config.py` in a text editor
   - Update the DB_CONFIG dictionary with your PostgreSQL credentials:
```python
DB_CONFIG = {
    'dbname': 'phase3_db_group19',  # Database name created in Step 2
    'user': 'YOUR_USERNAME',        # Your PostgreSQL username
    'password': 'YOUR_PASSWORD',    # Your PostgreSQL password
    'host': 'localhost',
    'port': '5432'
}
```

5. Set up ChromeDriver for web scraping:
   - For Mac with Apple Silicon (M1/M2/M3) from the root of the repository:
   ```bash
   chmod +x ../chromedriver-mac-arm64/chromedriver
   xattr -d com.apple.quarantine './chromedriver-mac-arm64/chromedriver'
   ```
   - For Windows/Linux or Intel Mac:
     - The WebDriver Manager will handle this automatically
     - If you encounter issues, you can manually download ChromeDriver:
       - Visit https://sites.google.com/chromium.org/driver/
       - Download the version matching your Chrome browser
       - Place it in the project root directory
       - Make it executable: `chmod +x chromedriver`

6. Install Chrome browser if not already installed:
   - Download from https://www.google.com/chrome/
   - Make sure it's up to date (the scraper works best with the latest version)

## Step 4: Start the Backend Server
Run the Flask application:
```bash
python application.py
```

You should see output similar to:
```
✅ Successfully connected to the phase3_db_group19 database!
 * Serving Flask app 'application'
 * Debug mode: on
 * Running on http://127.0.0.1:5050
```

**Important**: Keep this terminal window open and running.

## Step 5: Set Up and Run the Frontend
1. Open a new terminal window/tab

2. Navigate to the project's frontend directory:
```bash
cd ../frontend
```

3. Install the required npm packages:
```bash
npm install
```

4. Start the Next.js development server:
```bash
npm run dev
```

You should see output similar to:
```
ready - started server on 0.0.0.0:3000
```

## Step 6: Access the Application
1. Open your web browser and go to: http://localhost:3000

2. You should see the login/signup page of the application.

3. Register a new account with your email and password.

4. After logging in, you can explore courses, apply filters, and use the "Load more courses" functionality.

## Testing the Web Scraper
1. Search for a topic in the dashboard (e.g., "Python", "AI")

2. If no results are found, you'll see a "Find Courses Online" button. Click it to scrape new courses.

3. If results are shown, scroll down to find the "Load More Courses" button at the bottom.

4. The scraper will run in the backend, finding and adding at least 5 new courses to the database.

5. Monitor the backend terminal for scraping progress and any potential errors.

## Troubleshooting Common Issues

- **Database Connection Errors**:
  - Verify PostgreSQL is running with `pg_isready` command
  - Check that your credentials in `db_config.py` are correct
  - Confirm the database exists with `psql -U postgres -l`

- **Backend Server Won't Start**:
  - Ensure port 5050 is not already in use
  - Check that all dependencies are installed: `pip list`
  - Verify Python version: `python --version`

- **Frontend Server Issues**:
  - Ensure port 3000 is not already in use
  - Check Node.js version: `node --version`
  - Check npm version: `npm --version`

- **Scraper Not Working**:
  - Verify Chrome is installed and up to date
  - Check ChromeDriver permissions (for Mac)
  - Ensure ChromeDriver version matches your Chrome browser version
  - Look at backend terminal for detailed error messages
  - If you see "ChromeDriver executable needs to be in PATH" error:
    - For Mac: `export PATH=$PATH:$(pwd)/chromedriver-mac-arm64`
    - For Windows: Add the ChromeDriver directory to your system PATH
    - For Linux: `export PATH=$PATH:$(pwd)`
  - If you see "This version of ChromeDriver only supports Chrome version X":
    - Update your Chrome browser to the latest version
    - Or download the matching ChromeDriver version

---

A platform for ASU students to discover and bookmark online courses based on their interests, academic major, and desired skills. Built with Flask (backend) and Next.js (frontend).

## Features

- 👤 **User Authentication**
  - Sign up with major and skills selection
  - Secure login with password hashing
  - JWT-based session management

- 📚 **Course Discovery**
  - Browse courses from multiple platforms
  - Advanced filtering (major, difficulty, platform, institution)
  - Course details with prerequisites and skills

- 🔖 **Bookmarking**
  - Save courses for later
  - Manage bookmarked courses
  - Quick access to saved content

- 🎯 **Skills Tracking**
  - Select skills to learn
  - Course recommendations based on skills
  - Track learning progress
  
- 🔍 **Web Scraping**
  - "Load more courses" functionality
  - Automated scraping from Coursera
  - Automatic categorization of courses, skills, and institutions

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
  - Selenium for web scraping

## Project Structure

```
412_phase3/
├── backend/               # Flask backend
│   ├── application.py     # Main server file
│   ├── auth.py            # Authentication endpoints
│   ├── db_config.py       # Database configuration
│   ├── scraper.py         # Web scraping functionality
│   └── requirements.txt   # Python dependencies
|
├── database_setup/        # Database setup files
│   ├── setup.sql          # SQL script to create tables
│   └── dump/              # Database dump files
│       ├── asu_admin.csv            # ASU Admins data
│       ├── bookmark.csv             # Bookmarks data
│       ├── course_prerequisite.csv  # Course prerequisites data
│       ├── course_skills.csv        # Course skills data
│       ├── course.csv               # Courses data
│       ├── institutuon.csv          # Institutions data
│       ├── platform.csv             # Platforms data
│       ├── skill.csv                # Skills data
│       ├── student.csv              # Students data
│       ├── user_skills.csv          # User skills data
│       ├── user.csv                 # Users data
│
├── chromedriver-mac-arm64/ # ChromeDriver for Mac Apple Silicon
│
└── frontend/              # Next.js frontend
    ├── src/               # Source code
    │   ├── app/           # Next.js App Router
    │   │   ├── auth/      # Authentication pages
    │   │   └── dashboard/ # User dashboard
    │   └── components/    # Reusable UI components
    └── package.json       # Node.js dependencies
```
