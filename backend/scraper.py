"""
Course Scraper Module

This module scrapes course data from Coursera based on search keywords
and stores the results in the database according to our schema.

The module handles scraping, data formatting, and database operations.
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re
import os
import time
import json
from db_config import get_db_connection
import platform

def scrape_courses(search_keyword, max_courses=10):
    """
    Scrape courses based on search keyword and return data in the format required by the database
    
    This function:
    1. Initializes a headless Chrome browser
    2. Searches Coursera for the given keyword
    3. Extracts data from search results and individual course pages
    4. Formats data to match our database schema
    
    Args:
        search_keyword (str): The search term to use
        max_courses (int): Maximum number of courses to scrape
        
    Returns:
        list: A list of dictionaries with course data in the following format:
        {
            "title": "Course Title",
            "description": "Course Description",
            "url": "https://coursera.org/...",
            "difficulty": "Beginner|Intermediate|Advanced",
            "rating": 4.7,                         # Float value
            "num_enrollments": 10000,              # Integer value
            "platform": {                          # Platform information
                "name": "Coursera",
                "website": "https://www.coursera.org"
            },
            "institution": {                       # Institution information
                "name": "Institution Name"
            },
            "skills": [                           # List of skills
                {"name": "Skill 1"},
                {"name": "Skill 2"}
            ]
        }
    """
    print(f"Starting course scraping for keyword: {search_keyword}")
    
    # 1) Configure Chrome browser with headless mode for server deployment
    # These options make Chrome run without displaying a UI window
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')           # Required for running in Docker/some Linux environments
    options.add_argument('--disable-dev-shm-usage')  # Helps prevent browser crashes
    
    # Initialize Chrome driver - handling Mac with Apple Silicon specifically
    is_mac = platform.system() == 'Darwin'
    is_arm = platform.machine() == 'arm64'
    
    try:
        if is_mac and is_arm:
            # For Mac with Apple Silicon (M1/M2)
            print("Detected Mac with Apple Silicon")
            
            # Use the specific chromedriver we downloaded that matches Chrome 135.0.7049.115
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            chromedriver_path = os.path.join(project_root, 'chromedriver-mac-arm64', 'chromedriver')
            
            # Check if the file exists
            if os.path.exists(chromedriver_path):
                print(f"Using matching ChromeDriver from: {chromedriver_path}")
                service = Service(executable_path=chromedriver_path)
                driver = webdriver.Chrome(service=service, options=options)
            else:
                print(f"ChromeDriver not found at {chromedriver_path}")
                print("Falling back to WebDriver Manager (may cause version mismatch)")
                driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        else:
            # For all other platforms, use WebDriver Manager
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    except Exception as e:
        print(f"Error initializing Chrome driver: {e}")
        raise
    
    courses_data = []
    try:
        # 2) Navigate to Coursera and perform search
        driver.get("https://www.coursera.org")
        
        # Wait for search input to be clickable, then enter search term + ENTER key
        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "react-autosuggest__input"))
        ).send_keys(f"{search_keyword}\n")

        # Wait for search results to load (course cards) 
        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "cds-CommonCard-titleLink"))
        )

        # 3) Scroll to load more results (Coursera uses lazy loading)
        for _ in range(5):
            driver.execute_script("window.scrollBy(0,1000)")
            time.sleep(1)  # Wait for content to load after each scroll

        # Extract course links from search results (limited to max_courses)
        course_links = [
            e.get_attribute("href")
            for e in driver.find_elements(By.CLASS_NAME, "cds-CommonCard-titleLink")[:max_courses]
        ]

        # Define valid difficulty levels (for regex pattern matching)
        levels = ["Beginner", "Intermediate", "Advanced", "Mixed"]

        # 4) Process each course individually
        for idx, link in enumerate(course_links, start=1):
            print(f"[{idx}/{len(course_links)}] Scraping: {link}")
            
            # Visit individual course page
            driver.get(link)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            body_text = driver.find_element(By.TAG_NAME, "body").text

            # Initialize default course data structure (matches database schema)
            course_data = {
                "title": "N/A",
                "description": "N/A",
                "url": link,
                "difficulty": None,
                "rating": None,
                "num_enrollments": 0,
                "platform": {
                    "name": "Coursera",
                    "website": "https://www.coursera.org"
                },
                "institution": {
                    "name": "N/A"
                },
                "skills": []
            }

            # 5) Navigate to the About tab if it's not already selected
            try:
                about_btn = driver.find_element(
                    By.XPATH,
                    "//button[@aria-controls='about' or @data-e2e='about-tab']"
                )
                about_btn.click()
                time.sleep(1)  # Wait for tab content to load
            except:
                pass  # About tab might already be selected or have a different structure

            # 6) Locate the "What you'll learn" section where course info is usually found
            try:
                section = WebDriverWait(driver, 10).until(EC.presence_of_element_located((
                    By.XPATH,
                    "//div[@data-track-component='what_you_will_learn_section']"
                )))
                driver.execute_script("arguments[0].scrollIntoView(true);", section)
                time.sleep(1)  # Wait for elements to render after scrolling
            except:
                section = None  # Some courses might not have this section

            try:
                # 7) Extract course details using various selectors and regex patterns
                
                # Title - from the main heading
                title = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'h1[data-e2e="hero-title"]'))
                ).text
                course_data["title"] = title

                # Enrollments - extract from text using regex
                m = re.search(r"(\d[\d,]*)\s*already enrolled", body_text)
                if m: 
                    course_data["num_enrollments"] = int(m.group(1).replace(",", ""))

                # Rating - from star rating element
                try:
                    star = driver.find_element(By.CSS_SELECTOR, "div[aria-label*='stars']")
                    course_data["rating"] = float(star.get_attribute("aria-label").split()[0])
                except: 
                    pass  # Some courses might not have ratings

                # Difficulty level - extract from text using regex
                m = re.search(rf"({'|'.join(levels)})\s+level", body_text, re.IGNORECASE)
                if m: 
                    course_data["difficulty"] = m.group(1)

                # Institution - from the "Offered by" section
                try:
                    hdr = driver.find_element(By.XPATH, "//h3[contains(text(),'Offered by')]")
                    course_data["institution"]["name"] = hdr.find_element(By.XPATH, "./following::div//a//span").text
                except: 
                    pass  # Some courses might not have institution info

                # Description - from the first point in "What you'll learn" section
                if section:
                    try:
                        first_p = section.find_element(
                            By.XPATH,
                            ".//ul[contains(@class,'css-7avemv')]/li[1]//div[contains(@class,'unified-CML')]//p"
                        )
                        course_data["description"] = first_p.text.strip()
                    except:
                        pass  # Some courses have different description formats
                
                # Skills - from skills list elements
                try:
                    items = driver.find_elements(By.CSS_SELECTOR, "ul.css-yk0mzy li span.css-1l1jvyr")
                    for item in items:
                        skill_name = item.text.strip()
                        if skill_name:
                            course_data["skills"].append({"name": skill_name})
                except: 
                    pass  # Some courses might not have skills listed

                # Add successfully scraped course to our results
                courses_data.append(course_data)
                
            except Exception as e:
                print(f"  ⚠️ scrape warning for {link}: {e}")
                # Continue with next course even if this one failed

        print(f"✅ Successfully scraped {len(courses_data)} courses")
        return courses_data

    finally:
        # Always close the browser to free resources
        driver.quit()

# Add a function to save scraped data to JSON
def save_to_json(data, search_keyword):
    """
    Save scraped course data to a JSON file
    
    Args:
        data (list): List of course dictionaries
        search_keyword (str): The search term used
    """
    # Create a data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Create a timestamped filename
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(data_dir, f"scraped_courses_{search_keyword}_{timestamp}.json")
    
    # Save data to JSON file
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Scraped data saved to: {filename}")
    return filename

def store_scraped_courses(courses_data):
    """
    Store scraped courses in the database
    
    This function:
    1. Checks for existing courses to avoid duplicates
    2. Handles platform and institution relationships
    3. Creates skills and course-skill relationships
    4. Inserts courses with all the necessary foreign keys
    
    Args:
        courses_data (list): List of course dictionaries from scrape_courses()
        
    Returns:
        list: List of course IDs that were newly added to the database
    """
    conn = None
    added_course_ids = []
    
    try:
        # Get database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get the next available course_id (maximum existing + 1)
        cursor.execute("SELECT MAX(course_id) FROM course")
        max_id_result = cursor.fetchone()
        next_course_id = 1  # Default if table is empty
        if max_id_result and max_id_result[0] is not None:
            next_course_id = max_id_result[0] + 1
        
        print(f"Next available course_id: {next_course_id}")
        
        for course in courses_data:
            # 1. Check if course URL already exists (to prevent duplicates)
            cursor.execute("SELECT course_id, title FROM course WHERE url = %s", (course['url'],))
            exists_by_url = cursor.fetchone()
            
            if exists_by_url:
                print(f"Course already exists (URL match): {course['title']}")
                continue
            
            # Also check for similar titles (to prevent near-duplicates)
            cursor.execute(
                "SELECT course_id, title FROM course WHERE LOWER(title) = LOWER(%s)",
                (course['title'],)
            )
            exists_by_title = cursor.fetchone()
            
            if exists_by_title:
                print(f"Course with similar title already exists: {exists_by_title[1]}")
                continue
                
            # 2. Get or create platform
            platform_name = course['platform']['name']
            platform_website = course['platform']['website']
            
            cursor.execute(
                "SELECT platform_id FROM platform WHERE name = %s", 
                (platform_name,)
            )
            platform = cursor.fetchone()
            
            if not platform:
                # Create new platform if it doesn't exist
                cursor.execute(
                    "INSERT INTO platform (name, website) VALUES (%s, %s) RETURNING platform_id",
                    (platform_name, platform_website)
                )
                platform_id = cursor.fetchone()[0]
                print(f"Created new platform: {platform_name} (ID: {platform_id})")
            else:
                platform_id = platform[0]
                
            # 3. Get or create institution
            institution_id = None  # Default to NULL
            institution_name = course['institution']['name']
            
            if institution_name and institution_name != "N/A":
                cursor.execute(
                    "SELECT institution_id FROM institution WHERE name = %s", 
                    (institution_name,)
                )
                institution = cursor.fetchone()
                
                if not institution:
                    # Create new institution if it doesn't exist
                    cursor.execute(
                        "INSERT INTO institution (name) VALUES (%s) RETURNING institution_id",
                        (institution_name,)
                    )
                    institution_id = cursor.fetchone()[0]
                    print(f"Created new institution: {institution_name} (ID: {institution_id})")
                else:
                    institution_id = institution[0]
                
            # 4. Insert the course with explicit course_id to avoid collision
            cursor.execute(
                """
                INSERT INTO course (
                    course_id, title, description, difficulty, platform_id, 
                    institution_id, rating, url, num_enrollments
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING course_id
                """,
                (
                    next_course_id,
                    course['title'],
                    course['description'],
                    course['difficulty'],
                    platform_id,
                    institution_id,
                    course['rating'],
                    course['url'],
                    course['num_enrollments']
                )
            )
            
            # Get the inserted course_id and increment for next insertion
            course_id = cursor.fetchone()[0]
            added_course_ids.append(course_id)
            next_course_id += 1
            
            # 5. Process skills and create course-skill relationships
            for skill in course['skills']:
                skill_name = skill['name']
                
                # Check if skill already exists
                cursor.execute("SELECT skill_id FROM skill WHERE name = %s", (skill_name,))
                skill_record = cursor.fetchone()
                
                if not skill_record:
                    # Create new skill
                    cursor.execute(
                        "INSERT INTO skill (name) VALUES (%s) RETURNING skill_id",
                        (skill_name,)
                    )
                    skill_id = cursor.fetchone()[0]
                    print(f"Created new skill: {skill_name} (ID: {skill_id})")
                else:
                    skill_id = skill_record[0]
                    
                # Link skill to course in the course_skills junction table
                # ON CONFLICT DO NOTHING prevents errors if relationship already exists
                cursor.execute(
                    "INSERT INTO course_skills (course_id, skill_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (course_id, skill_id)
                )
            
            print(f"Added course: {course['title']} (ID: {course_id})")
            
        # Commit all database changes at once
        conn.commit()
        return added_course_ids
        
    except Exception as e:
        print(f"Error storing courses: {e}")
        if conn:
            # Rollback on error to maintain database integrity
            conn.rollback()
        return []
        
    finally:
        if conn:
            # Always close connection
            conn.close()

def scrape_and_store(keyword, max_courses=10, min_new_courses=5):
    """
    Main function to scrape courses based on keyword and store them in the database
    
    This is the main entry point for the scraping process that:
    1. Calls scrape_courses() to get course data
    2. Saves data to JSON (for backup and reference)
    3. Calls store_scraped_courses() to store the data
    4. Returns IDs of newly added courses
    
    Args:
        keyword (str): Search keyword
        max_courses (int): Maximum number of courses to scrape in each batch
        min_new_courses (int): Minimum number of new courses to add to the database
        
    Returns:
        list: List of course IDs that were added to the database
    """
    # Initialize variables
    all_added_course_ids = []
    batch_number = 1
    batch_size = max_courses
    
    # Keep scraping in batches until we've found at least min_new_courses new courses
    while len(all_added_course_ids) < min_new_courses:
        print(f"Batch #{batch_number}: Scraping with batch_size={batch_size}")
        
        # Step 1: Scrape course data from Coursera
        courses_data = scrape_courses(keyword, batch_size)
        
        # Step 2: Save data to JSON (for backup and reference)
        if courses_data:
            json_file = save_to_json(courses_data, f"{keyword}_batch{batch_number}")
        
        # Step 3: Store the scraped data in the database
        added_course_ids = store_scraped_courses(courses_data)
        all_added_course_ids.extend(added_course_ids)
        
        print(f"Batch #{batch_number}: Added {len(added_course_ids)} new courses. Total: {len(all_added_course_ids)}")
        
        # If we added less than expected, increase batch size for next attempt
        if len(added_course_ids) < batch_size * 0.25:  # If less than 25% of scraped courses are new
            batch_size += 5
            print(f"Low yield of new courses, increasing batch size to {batch_size}")
        
        # Safety check - if we've tried multiple times with large batches and still not enough
        if batch_number >= 3 or batch_size > 30:
            print(f"Reached maximum search attempts. Stopping with {len(all_added_course_ids)} new courses")
            break
            
        batch_number += 1
    
    print(f"Added {len(all_added_course_ids)} new courses to database")
    return all_added_course_ids

# This block only runs when the script is executed directly (not imported)
if __name__ == "__main__":
    # For manual testing - get input from command line
    keyword = input("Enter search keyword: ")
    max_courses = int(input("Enter maximum number of courses to scrape in each batch (default 10): ") or "10")
    min_new_courses = int(input("Enter minimum number of new courses to add to the database (default 5): ") or "5")
    
    # Run the scraper with provided inputs
    scrape_and_store(keyword, max_courses, min_new_courses) 