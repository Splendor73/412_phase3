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
            SELECT c.course_id, c.title, c.description, c.url,
                   c.rating, c.num_enrollments, c.difficulty, c.platform_id,
                   p.name as platform_name, p.website,
                   i.institution_id, i.name as institution_name
            FROM course c
            LEFT JOIN platform p ON c.platform_id = p.platform_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            WHERE 1=1
        '''
        params = []
        
        # Apply filters from query parameters
        if request.args.get('difficulty'):
            query += ' AND c.difficulty = %s'
            params.append(request.args.get('difficulty'))
            
        if request.args.get('platform_id'):
            query += ' AND c.platform_id = %s'
            params.append(int(request.args.get('platform_id')))
            
        if request.args.get('institution_id'):
            query += ' AND c.institution_id = %s'
            params.append(int(request.args.get('institution_id')))
            
        if request.args.get('min_rating'):
            query += ' AND c.rating >= %s'
            params.append(float(request.args.get('min_rating')))
            
        if request.args.get('skill_ids'):
            query = '''
                SELECT DISTINCT c.course_id, c.title, c.description, c.url,
                       c.rating, c.num_enrollments, c.difficulty, c.platform_id,
                       p.name as platform_name, p.website,
                       i.institution_id, i.name as institution_name
                FROM course c
                LEFT JOIN platform p ON c.platform_id = p.platform_id
                JOIN course_skills cs ON c.course_id = cs.course_id
                LEFT JOIN institution i ON c.institution_id = i.institution_id
                WHERE cs.skill_id = ANY(%s)
            '''
            params = [int(skill_id) for skill_id in request.args.get('skill_ids').split(',')]
        
        cur.execute(query, params)
        courses = cur.fetchall()
        
        # --- Fetch Skills for the fetched courses --- 
        course_ids = [course[0] for course in courses]
        skills_map = {}
        if course_ids:
            skills_query = '''
                SELECT cs.course_id, s.skill_id, s.name
                FROM course_skills cs
                JOIN skill s ON cs.skill_id = s.skill_id
                WHERE cs.course_id = ANY(%s)
            '''
            cur.execute(skills_query, (course_ids,))
            skills_data = cur.fetchall()
            for course_id, skill_id, skill_name in skills_data:
                if course_id not in skills_map:
                    skills_map[course_id] = []
                skills_map[course_id].append({'skill_id': skill_id, 'name': skill_name})
        # --- End Fetch Skills ---
        
        result = []
        for course in courses:
            course_id = course[0]
            course_data = {
                'course_id': course_id,
                'title': course[1],
                'description': course[2],
                'url': course[3],
                'rating': course[4],
                'num_enrollments': course[5],
                'difficulty': course[6],
                'platform': {
                    'platform_id': course[7],
                    'name': course[8],
                    'website': course[9]
                },
                'institution': {
                    'institution_id': course[10],
                    'name': course[11]
                },
                'skills': skills_map.get(course_id, [])
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
            SELECT c.course_id, c.title, c.description, c.url,
                   c.rating, c.num_enrollments, c.difficulty, c.platform_id,
                   p.name as platform_name, p.website,
                   i.institution_id, i.name as institution_name
            FROM course c
            LEFT JOIN platform p ON c.platform_id = p.platform_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
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
            'url': course[3],
            'rating': course[4],
            'num_enrollments': course[5],
            'difficulty': course[6],
            'platform': {
                'platform_id': course[7],
                'name': course[8],
                'website': course[9]
            },
            'institution': {
                'institution_id': course[10],
                'name': course[11]
            },
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
            SELECT c.course_id, c.title, c.description, c.url,
                   c.rating, c.num_enrollments, c.difficulty, c.platform_id,
                   p.name as platform_name, p.website,
                   i.institution_id, i.name as institution_name
            FROM bookmark b
            JOIN course c ON b.course_id = c.course_id
            LEFT JOIN platform p ON c.platform_id = p.platform_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
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
                'url': bookmark[3],
                'rating': bookmark[4],
                'num_enrollments': bookmark[5],
                'difficulty': bookmark[6],
                'platform': {
                    'platform_id': bookmark[7],
                    'name': bookmark[8],
                    'website': bookmark[9]
                },
                'institution': {
                    'institution_id': bookmark[10],
                    'name': bookmark[11]
                }
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
            
@app.route('/api/institutions', methods=['GET'])
def get_institutions():
    """Get all available institutions"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT institution_id, name FROM institution')
        institutions = cur.fetchall()
        
        result = []
        for institution in institutions:
            institution_data = {
                'institution_id': institution[0],
                'name': institution[1]
            }
            result.append(institution_data)
            
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

# --- User Profile Endpoints ---

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.user_id, u.first_name, u.last_name, u.email, u.type, 
                   s.major, s.skill_level
            FROM "user" u
            LEFT JOIN student s ON u.user_id = s.user_id
            WHERE u.user_id = %s
        ''', (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_data = {
            'user_id': user[0],
            'first_name': user[1],
            'last_name': user[2],
            'email': user[3],
            'type': user[4],
            'major': user[5],
            'level': user[6]
        }
        return jsonify(user_data)
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        return jsonify({"error": "Failed to fetch user profile", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user_profile(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Separate user table fields from student table fields
        user_set_clauses = []
        user_params = []
        student_set_clauses = []
        student_params = []
        
        # Fields for user table
        user_fields = ['first_name', 'last_name', 'email', 'type']
        # Fields for student table
        student_fields = ['major']
        
        # Special handling for level which maps to skill_level in DB
        if 'level' in data:
            student_set_clauses.append("skill_level = %s")
            student_params.append(data['level'])
        
        # Process user table fields
        for field in user_fields:
            if field in data:
                user_set_clauses.append(f"{field} = %s")
                user_params.append(data[field])

        # Process student table fields (except level already handled)
        for field in student_fields:
            if field in data:
                student_set_clauses.append(f"{field} = %s")
                student_params.append(data[field])
                
        if not user_set_clauses and not student_set_clauses:
            return jsonify({"error": "No valid fields provided for update"}), 400

        # Start a transaction since we need to update potentially two tables
        conn.autocommit = False
        updated_user = None
        
        # Update user table if needed
        if user_set_clauses:
            user_params.append(user_id)  # Add user_id for WHERE clause
            user_query = f'''
                UPDATE "user"
                SET {', '.join(user_set_clauses)}
                WHERE user_id = %s
                RETURNING user_id, first_name, last_name, email, type
            '''
            cur.execute(user_query, tuple(user_params))
            updated_user = cur.fetchone()
            
            if not updated_user:
                conn.rollback()
                return jsonify({"error": "User not found or update failed"}), 404
        
        # Check if we need to update the student table
        if student_set_clauses:
            # First check if student record exists
            cur.execute('SELECT 1 FROM student WHERE user_id = %s', (user_id,))
            student_exists = cur.fetchone() is not None
            
            if student_exists:
                # Update existing student record
                student_params.append(user_id)  # Add user_id for WHERE clause
                student_query = f'''
                    UPDATE student
                    SET {', '.join(student_set_clauses)}
                    WHERE user_id = %s
                    RETURNING user_id, major, skill_level
                '''
                cur.execute(student_query, tuple(student_params))
            else:
                # Insert new student record if it doesn't exist
                all_fields = ['user_id']
                all_values = [user_id]
                
                if 'major' in data:
                    all_fields.append('major')
                    all_values.append(data['major'])
                
                if 'level' in data:
                    all_fields.append('skill_level') 
                    all_values.append(data['level'])
                
                if len(all_fields) > 1:  # Only if we have fields beyond user_id
                    student_query = f'''
                        INSERT INTO student ({', '.join(all_fields)})
                        VALUES ({', '.join(['%s' for _ in all_fields])})
                        RETURNING user_id, major, skill_level
                    '''
                    cur.execute(student_query, tuple(all_values))
        
        # If we only updated student table, we need to fetch user data separately
        if not updated_user:
            cur.execute('''
                SELECT user_id, first_name, last_name, email, type
                FROM "user" WHERE user_id = %s
            ''', (user_id,))
            updated_user = cur.fetchone()
            
            if not updated_user:
                conn.rollback()
                return jsonify({"error": "User not found"}), 404
        
        # Fetch the updated student data
        cur.execute('''
            SELECT major, skill_level FROM student WHERE user_id = %s
        ''', (user_id,))
        student_data = cur.fetchone()
        
        conn.commit()
        
        # Return updated user data
        user_data = {
            'user_id': updated_user[0],
            'first_name': updated_user[1],
            'last_name': updated_user[2],
            'email': updated_user[3],
            'type': updated_user[4],
            'major': student_data[0] if student_data else None,
            'level': student_data[1] if student_data else None
        }
        return jsonify({"message": "Profile updated successfully", "user": user_data})
        
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error updating user {user_id}: {e}")
        # Check for unique constraint violation (e.g., email already exists)
        if 'unique constraint' in str(e).lower() and 'email' in str(e).lower():
             return jsonify({"error": "Email already in use by another account."}), 409 # Conflict
        return jsonify({"error": "Failed to update profile", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()

# --- End User Profile Endpoints ---

# --- Add Scrape Courses API ---
@app.route('/api/scrape-courses', methods=['GET'])
def scrape_more_courses():
    try:
        # Get query parameters
        query = request.args.get('query', '')
        max_courses = int(request.args.get('max_courses', '10'))
        min_new_courses = int(request.args.get('min_new_courses', '5'))
        
        if not query:
            return jsonify({"error": "Query parameter is required"}), 400
            
        # Import here to avoid circular imports
        from scraper import scrape_and_store
        
        # Run the scraper
        print(f"Starting scraper for query: {query} with max_courses: {max_courses}, min_new_courses: {min_new_courses}")
        new_course_ids = scrape_and_store(query, max_courses, min_new_courses)
        
        if not new_course_ids:
            print("No new courses found")
            return jsonify({"message": "No new courses found or added", "courses": []}), 200
            
        print(f"Found {len(new_course_ids)} new courses")
        
        # Fetch the newly added courses with full details to return to frontend
        conn = get_db_connection()
        cur = conn.cursor()
        
        placeholders = ','.join(['%s'] * len(new_course_ids))
        query = f'''
            SELECT c.course_id, c.title, c.description, c.url,
                   c.rating, c.num_enrollments, c.difficulty, c.platform_id,
                   p.name as platform_name, p.website,
                   i.institution_id, i.name as institution_name
            FROM course c
            LEFT JOIN platform p ON c.platform_id = p.platform_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            WHERE c.course_id IN ({placeholders})
        '''
        
        cur.execute(query, new_course_ids)
        courses = cur.fetchall()
        
        # Fetch skills for the new courses
        skills_map = {}
        if new_course_ids:
            skills_query = '''
                SELECT cs.course_id, s.skill_id, s.name
                FROM course_skills cs
                JOIN skill s ON cs.skill_id = s.skill_id
                WHERE cs.course_id = ANY(%s)
            '''
            cur.execute(skills_query, (new_course_ids,))
            skills_data = cur.fetchall()
            
            for course_id, skill_id, skill_name in skills_data:
                if course_id not in skills_map:
                    skills_map[course_id] = []
                skills_map[course_id].append({'skill_id': skill_id, 'name': skill_name})
        
        # Format the new courses just like in get_courses route
        result = []
        for course in courses:
            course_id = course[0]
            course_data = {
                'course_id': course_id,
                'title': course[1],
                'description': course[2],
                'url': course[3],
                'rating': course[4],
                'num_enrollments': course[5],
                'difficulty': course[6],
                'platform': {
                    'platform_id': course[7],
                    'name': course[8],
                    'website': course[9]
                },
                'institution': {
                    'institution_id': course[10],
                    'name': course[11]
                },
                'skills': skills_map.get(course_id, [])
            }
            result.append(course_data)
            
        conn.close()
        
        return jsonify({
            "message": f"Successfully added {len(new_course_ids)} new courses",
            "courses": result
        })
        
    except Exception as e:
        print(f"Error in scrape_more_courses: {str(e)}")
        return jsonify({"error": f"Failed to scrape courses: {str(e)}"}), 500

if __name__ == '__main__':
    # Check if this is the initial startup (not a reload)
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        # Initialize database tables
        init_db()
        
        # Test database connection at startup
        success, tables = test_connection()
    
    app.run(debug=True, port=5050)
