import psycopg2
from psycopg2 import Error

# Database configuration
DB_CONFIG = {
    'dbname': 'phase3_db',
    'user': 'yashupatel',
    'password': '1973',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    """Get a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True  # Set autocommit to True by default
        print(f"✅ Successfully connected to the {DB_CONFIG['dbname']} database!")
        return conn
    except Error as e:
        print(f"❌ Database connection failed: {str(e)}")
        return None

def test_connection():
    """Test database connection and get table information"""
    conn = None
    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
            tables = cursor.fetchall()
            table_names = [table[0] for table in tables]
            cursor.close()
            
            print(f"📊 The database contains {len(tables)} tables: {', '.join(table_names)}")
            return True, table_names
        return False, []
    except Error as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False, []
    finally:
        if conn:
            conn.close()

def init_db():
    """Initialize the database tables if they don't exist"""
    conn = None
    try:
        conn = get_db_connection()
        if conn:
            cur = conn.cursor()
            
            # Create tables
            cur.execute('''
                -- Create User table
                CREATE TABLE IF NOT EXISTS "user" (
                    user_id SERIAL PRIMARY KEY,
                    first_name VARCHAR(50) NOT NULL,
                    last_name VARCHAR(50) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Create Student table
                CREATE TABLE IF NOT EXISTS student (
                    user_id INTEGER PRIMARY KEY REFERENCES "user"(user_id) ON DELETE CASCADE,
                    major VARCHAR(100),
                    skill_level VARCHAR(50),
                    learning_goals TEXT
                );

                -- Create ASU Admin table
                CREATE TABLE IF NOT EXISTS asu_admin (
                    user_id INTEGER PRIMARY KEY REFERENCES "user"(user_id) ON DELETE CASCADE,
                    department VARCHAR(100),
                    job_title VARCHAR(100)
                );

                -- Create Platform table
                CREATE TABLE IF NOT EXISTS platform (
                    platform_id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    website VARCHAR(255)
                );

                -- Create Course table
                CREATE TABLE IF NOT EXISTS course (
                    course_id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    price NUMERIC(10,2),
                    duration VARCHAR(50),
                    difficulty VARCHAR(50),
                    platform_id INTEGER REFERENCES platform(platform_id),
                    major VARCHAR(100)
                );

                -- Create Course Prerequisites table
                CREATE TABLE IF NOT EXISTS course_prerequisite (
                    course_id INTEGER REFERENCES course(course_id) ON DELETE CASCADE,
                    prerequisite_course_id INTEGER REFERENCES course(course_id) ON DELETE CASCADE,
                    PRIMARY KEY (course_id, prerequisite_course_id)
                );

                -- Create Bookmark table
                CREATE TABLE IF NOT EXISTS bookmark (
                    user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
                    course_id INTEGER REFERENCES course(course_id) ON DELETE CASCADE,
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, course_id)
                );

                -- Create Skill table
                CREATE TABLE IF NOT EXISTS skill (
                    skill_id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL
                );

                -- Create User Skills table
                CREATE TABLE IF NOT EXISTS user_skills (
                    user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
                    skill_id INTEGER REFERENCES skill(skill_id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, skill_id)
                );

                -- Create Course Skills table
                CREATE TABLE IF NOT EXISTS course_skills (
                    course_id INTEGER REFERENCES course(course_id) ON DELETE CASCADE,
                    skill_id INTEGER REFERENCES skill(skill_id) ON DELETE CASCADE,
                    PRIMARY KEY (course_id, skill_id)
                );
            ''')
            
            conn.commit()
            print("✅ Database tables initialized successfully!")
            return True
    except Error as e:
        print(f"❌ Error initializing database: {str(e)}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close() 