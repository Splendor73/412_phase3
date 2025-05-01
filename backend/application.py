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
        
        # Build the query with filters
        query = '''
            SELECT c.course_id, c.title, c.description, c.price, 
                   c.duration, c.difficulty, c.platform_id, c.major,
                   p.name as platform_name
            FROM course c
            LEFT JOIN platform p ON c.platform_id = p.platform_id
            WHERE 1=1
        '''
        params = []
        
        # Apply filters from query parameters
        if request.args.get('difficulty'):
            query += ' AND c.difficulty = %s'
            params.append(request.args.get('difficulty'))
            
        if request.args.get('major'):
            query += ' AND c.major = %s'
            params.append(request.args.get('major'))
            
        if request.args.get('platform_id'):
            query += ' AND c.platform_id = %s'
            params.append(int(request.args.get('platform_id')))
            
        if request.args.get('min_price'):
            query += ' AND c.price >= %s'
            params.append(float(request.args.get('min_price')))
            
        if request.args.get('max_price'):
            query += ' AND c.price <= %s'
            params.append(float(request.args.get('max_price')))
            
        if request.args.get('skill_id'):
            query = '''
                SELECT DISTINCT c.course_id, c.title, c.description, c.price, 
                       c.duration, c.difficulty, c.platform_id, c.major,
                       p.name as platform_name
                FROM course c
                LEFT JOIN platform p ON c.platform_id = p.platform_id
                JOIN course_skills cs ON c.course_id = cs.course_id
                WHERE cs.skill_id = %s
            '''
            params = [int(request.args.get('skill_id'))]
        
        cur.execute(query, params)
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

@app.route('/api/bookmarks', methods=['GET'])
def get_user_bookmarks():
    """Get all bookmarked courses for the current user"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            SELECT c.*, p.name as platform_name
            FROM bookmark b
            JOIN course c ON b.course_id = c.course_id
            JOIN platform p ON c.platform_id = p.platform_id
            WHERE b.user_id = %s
        ''', (user_id,))
        bookmarks = cur.fetchall()
        
        # Convert to list of dictionaries
        bookmarks_list = []
        for bookmark in bookmarks:
            bookmarks_list.append({
                'course_id': bookmark[0],
                'title': bookmark[1],
                'description': bookmark[2],
                'price': float(bookmark[3]) if bookmark[3] else None,
                'duration': bookmark[4],
                'difficulty': bookmark[5],
                'platform_id': bookmark[6],
                'major': bookmark[7],
                'platform_name': bookmark[8]
            })
        
        return jsonify(bookmarks_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/bookmarks', methods=['POST'])
def add_bookmark():
    """Add a course to user's bookmarks"""
    data = request.get_json()
    user_id = data.get('user_id')
    course_id = data.get('course_id')
    
    if not user_id or not course_id:
        return jsonify({'error': 'User ID and Course ID are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            INSERT INTO bookmark (user_id, course_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, course_id) DO NOTHING
        ''', (user_id, course_id))
        conn.commit()
        return jsonify({'message': 'Bookmark added successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/bookmarks', methods=['DELETE'])
def remove_bookmark():
    """Remove a course from user's bookmarks"""
    user_id = request.args.get('user_id')
    course_id = request.args.get('course_id')
    
    if not user_id or not course_id:
        return jsonify({'error': 'User ID and Course ID are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            DELETE FROM bookmark
            WHERE user_id = %s AND course_id = %s
        ''', (user_id, course_id))
        conn.commit()
        return jsonify({'message': 'Bookmark removed successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/platforms', methods=['GET'])
def get_platforms():
    """Get all available platforms"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT platform_id, name, website FROM platform')
        platforms = cur.fetchall()
        
        result = []
        for platform in platforms:
            platform_data = {
                'platform_id': platform[0],
                'name': platform[1],
                'website': platform[2]
            }
            result.append(platform_data)
            
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/majors', methods=['GET'])
def get_majors():
    """Get all available majors"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT DISTINCT major FROM course WHERE major IS NOT NULL')
        majors = cur.fetchall()
        
        result = [major[0] for major in majors]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get all available skills"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT skill_id, name FROM skill')
        skills = cur.fetchall()
        
        result = []
        for skill in skills:
            skill_data = {
                'skill_id': skill[0],
                'name': skill[1]
            }
            result.append(skill_data)
            
        return jsonify(result)
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
