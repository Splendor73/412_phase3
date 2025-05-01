from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from db_config import get_db_connection, test_connection, init_db
from auth import auth_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Define a basic route to verify server is running
@app.route('/')
def home():
    return jsonify({"message": "Flask server is running!"})

# Route to test database connection
@app.route('/test-db')
def test_db():
    try:
        result, tables = test_connection()
        if result:
            return jsonify({
                "status": "success", 
                "message": "Database connection successful!",
                "tables": tables
            })
        else:
            return jsonify({"status": "error", "message": "Database connection failed"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Database connection failed: {str(e)}"})

# API Endpoints for Courses
@app.route('/api/courses', methods=['GET'])
def get_courses():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT c.course_id, c.title, c.description, c.price, 
                   c.duration, c.difficulty, c.platform_id, c.major,
                   p.name as platform_name
            FROM course c
            LEFT JOIN platform p ON c.platform_id = p.platform_id
        ''')
        courses = cur.fetchall()
        
        result = []
        for course in courses:
            course_data = {
                'course_id': course[0],
                'title': course[1],
                'description': course[2],
                'price': float(course[3]) if course[3] else None,
                'duration': course[4],
                'difficulty': course[5],
                'platform_id': course[6],
                'major': course[7],
                'platform_name': course[8]
            }
            result.append(course_data)
            
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get course details
        cur.execute('''
            SELECT c.course_id, c.title, c.description, c.price, 
                   c.duration, c.difficulty, c.platform_id, c.major,
                   p.name as platform_name
            FROM course c
            LEFT JOIN platform p ON c.platform_id = p.platform_id
            WHERE c.course_id = %s
        ''', (course_id,))
        
        course = cur.fetchone()
        if not course:
            return jsonify({"error": "Course not found"}), 404
            
        # Get prerequisites
        cur.execute('''
            SELECT c.course_id, c.title
            FROM course c
            JOIN course_prerequisite cp ON c.course_id = cp.prerequisite_course_id
            WHERE cp.course_id = %s
        ''', (course_id,))
        prerequisites = cur.fetchall()
        
        # Get skills
        cur.execute('''
            SELECT s.skill_id, s.name
            FROM skill s
            JOIN course_skills cs ON s.skill_id = cs.skill_id
            WHERE cs.course_id = %s
        ''', (course_id,))
        skills = cur.fetchall()
        
        course_data = {
            'course_id': course[0],
            'title': course[1],
            'description': course[2],
            'price': float(course[3]) if course[3] else None,
            'duration': course[4],
            'difficulty': course[5],
            'platform_id': course[6],
            'major': course[7],
            'platform_name': course[8],
            'prerequisites': [{'course_id': p[0], 'title': p[1]} for p in prerequisites],
            'skills': [{'skill_id': s[0], 'name': s[1]} for s in skills]
        }
            
        return jsonify(course_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    # Check if this is the initial startup (not a reload)
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        # Initialize database tables
        init_db()
        
        # Test database connection at startup
        success, tables = test_connection()
    
    app.run(debug=True, port=5050)
