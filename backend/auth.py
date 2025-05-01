import hashlib
import secrets
import re
from flask import Blueprint, request, jsonify
from db_config import get_db_connection

# Create authentication blueprint
auth_bp = Blueprint('auth', __name__)

def hash_password(password, salt=None):
    """Hash a password with a salt for safe storage"""
    if salt is None:
        salt = secrets.token_hex(16)  # Generate a new salt for new passwords
    
    # Combine password and salt, then hash
    hash_obj = hashlib.sha256((password + salt).encode())
    password_hash = hash_obj.hexdigest()
    
    # Return the combined salt:hash format for storage
    return f"{salt}:{password_hash}", salt

def verify_password(stored_password, input_password):
    """Verify a password against a stored password hash"""
    # Extract salt from stored password
    try:
        salt, stored_hash = stored_password.split(":", 1)
        
        # Hash the input password with the extracted salt
        input_password_hash = hashlib.sha256((input_password + salt).encode()).hexdigest()
        
        # Compare the hashes
        return input_password_hash == stored_hash
    except ValueError:
        # If the stored_password doesn't contain a :, it's in an old format
        return False

def is_valid_email(email):
    """Check if email format is valid"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_strong_password(password):
    """Check if password meets strength requirements"""
    # At least 8 characters, with at least one number and one special character
    if len(password) < 8:
        return False, "Password must be at least 8 characters."
    
    if not re.search(r'\d', password):
        return False, "Password must include at least one number."
    
    if not re.search(r'[^\w\s]', password):
        return False, "Password must include at least one special character."
    
    return True, "Password is strong."

# Routes
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    conn = None
    cur = None
    try:
        data = request.json
        print(f"Registration data received: {data}")
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'password', 'type']
        if not all(field in data for field in required_fields):
            missing = [field for field in required_fields if field not in data]
            print(f"Missing required fields: {missing}")
            return jsonify({"status": "error", "message": f"Missing required fields: {missing}"}), 400
        
        # Extract data
        first_name = data['firstName']
        last_name = data['lastName']
        email = data['email']
        password = data['password']
        user_type = data['type']  # 'student' or 'admin'
        
        # Basic validation
        if not is_valid_email(email):
            print(f"Invalid email format: {email}")
            return jsonify({"status": "error", "message": "Invalid email format"}), 400
        
        is_valid, pwd_msg = is_strong_password(password)
        if not is_valid:
            print(f"Password validation failed: {pwd_msg}")
            return jsonify({"status": "error", "message": pwd_msg}), 400
            
        # Additional fields based on user type
        major = data.get('major') if user_type == 'student' else None
        skill_level = data.get('skillLevel') if user_type == 'student' else None
        learning_goals = data.get('learningGoals') if user_type == 'student' else None
        department = data.get('department') if user_type == 'admin' else None
        job_title = data.get('jobTitle') if user_type == 'admin' else None
        
        # Get skill IDs from comma-separated learning_goals if present
        skill_ids = []
        if learning_goals:
            # Extract skill names from the comma-separated string
            skill_names = [s.strip() for s in learning_goals.split(',')]
            print(f"Processing skills: {skill_names}")
        
        print(f"Processing registration for {user_type}: {first_name} {last_name} <{email}>")
        
        # Hash password with salt - stored as "salt:hash"
        hashed_password, _ = hash_password(password)
        
        # Connect to database
        conn = get_db_connection()
        if not conn:
            print("Database connection failed during registration")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Check if email already exists
        cur.execute("SELECT user_id FROM \"user\" WHERE email = %s", (email,))
        if cur.fetchone():
            print(f"Email already registered: {email}")
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Email already registered"}), 400
        
        # Start the transaction
        cur.execute("BEGIN")
        
        try:
            # Insert into user table (password now contains salt:hash)
            cur.execute(
                "INSERT INTO \"user\" (first_name, last_name, email, password, type) VALUES (%s, %s, %s, %s, %s) RETURNING user_id",
                (first_name, last_name, email, hashed_password, user_type)
            )
            user_id = cur.fetchone()[0]
            print(f"Created new user with ID: {user_id}")
            
            # Insert additional data based on user type
            if user_type == 'student':
                cur.execute(
                    "INSERT INTO student (user_id, major, skill_level, learning_goals) VALUES (%s, %s, %s, %s)",
                    (user_id, major, skill_level, learning_goals)
                )
                
                # Process skills if any are provided
                if skill_names:
                    for skill_name in skill_names:
                        if not skill_name:
                            continue
                            
                        # Check if skill exists
                        cur.execute("SELECT skill_id FROM skill WHERE name = %s", (skill_name,))
                        result = cur.fetchone()
                        
                        if result:
                            # Skill exists, get its ID
                            skill_id = result[0]
                        else:
                            # Create new skill
                            cur.execute(
                                "INSERT INTO skill (name) VALUES (%s) RETURNING skill_id",
                                (skill_name,)
                            )
                            skill_id = cur.fetchone()[0]
                        
                        # Add to skill_ids for later
                        skill_ids.append(skill_id)
                        
                        # Link skill to user
                        cur.execute(
                            "INSERT INTO user_skills (user_id, skill_id) VALUES (%s, %s)",
                            (user_id, skill_id)
                        )
                        
            elif user_type == 'admin':
                cur.execute(
                    "INSERT INTO asu_admin (user_id, department, job_title) VALUES (%s, %s, %s)",
                    (user_id, department, job_title)
                )
            
            # Commit transaction
            cur.execute("COMMIT")
            
            return jsonify({
                "status": "success", 
                "message": "User registered successfully",
                "user": {
                    "id": user_id,
                    "firstName": first_name,
                    "lastName": last_name,
                    "email": email,
                    "type": user_type
                }
            })
            
        except Exception as e:
            # Rollback in case of error
            cur.execute("ROLLBACK")
            print(f"Registration transaction failed: {str(e)}")
            return jsonify({"status": "error", "message": f"Registration failed: {str(e)}"}), 500
            
    except Exception as e:
        # Make sure we rollback if anything fails
        if conn and cur:
            cur.execute("ROLLBACK")
        print(f"Unhandled error during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
        
    finally:
        # Close database resources
        if cur:
            cur.close()
        if conn:
            conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user"""
    try:
        data = request.json
        
        # Validate required fields
        if not all(field in data for field in ['email', 'password']):
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        email = data['email']
        password = data['password']
        
        # Connect to database
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Get user by email
        cur.execute(
            "SELECT user_id, first_name, last_name, email, password, type FROM \"user\" WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        
        # Check if user exists
        if not user:
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401
        
        # Extract user data
        user_id, first_name, last_name, user_email, stored_password, user_type = user
        
        # Verify password
        if not verify_password(stored_password, password):
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401
        
        # Get additional user info based on type
        additional_info = {}
        if user_type == 'student':
            cur.execute(
                "SELECT major, skill_level, learning_goals FROM student WHERE user_id = %s", 
                (user_id,)
            )
            student_info = cur.fetchone()
            if student_info:
                major, skill_level, learning_goals = student_info
                additional_info = {
                    "major": major,
                    "skillLevel": skill_level,
                    "learningGoals": learning_goals
                }
        elif user_type == 'admin':
            cur.execute(
                "SELECT department, job_title FROM asu_admin WHERE user_id = %s", 
                (user_id,)
            )
            admin_info = cur.fetchone()
            if admin_info:
                department, job_title = admin_info
                additional_info = {
                    "department": department,
                    "jobTitle": job_title
                }
        
        cur.close()
        conn.close()
        
        # Return user info
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "id": user_id,
                "firstName": first_name,
                "lastName": last_name,
                "email": user_email,
                "type": user_type,
                **additional_info
            }
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500 