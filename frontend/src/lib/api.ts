// API utility functions for interacting with the backend

export const API_BASE_URL = 'http://localhost:5050/api';

interface FilterParams {
  difficulty?: string;
  platform_id?: number;
  institution_id?: number;
  min_rating?: number;
  skill_ids?: number[];
}

export const skillLevels = ["Beginner", "Intermediate", "Advanced"] as const;

export const majors = [
  'Computer Science',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Business Administration',
  'Biology',
  'Psychology',
  'Finance',
  'Marketing',
  'Civil Engineering',
  'Mathematics'
] as const;

export interface CoursePrerequisite {
  course_id: number;
  title: string;
}

export interface Course {
  course_id: number;
  title: string;
  description: string;
  url: string;
  rating: number;
  num_enrollments: number;
  difficulty: string;
  platform: Platform;
  institution: Institution;
  skills?: Skill[];
  prerequisites?: CoursePrerequisite[];
}

export interface Platform {
  platform_id: number;
  name: string;
  website: string;
}

export interface Institution {
  institution_id: number;
  name: string;
}

export interface Skill {
  skill_id: number;
  name: string;
}

/**
 * Fetch all courses from the API with optional filters
 * @param filters Optional filter parameters
 * @returns Promise with course data
 */
export async function getCourses(filters?: FilterParams) {
  try {
    let url = `${API_BASE_URL}/courses`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.platform_id) params.append('platform_id', filters.platform_id.toString());
      if (filters.institution_id) params.append('institution_id', filters.institution_id.toString());
      if (filters.min_rating) params.append('min_rating', filters.min_rating.toString());
      if (filters.skill_ids) params.append('skill_ids', filters.skill_ids.join(','));
      
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);

    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("courses:", data);
    return data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

/**
 * Scrape and add more courses based on a search query
 * @param query Search query to scrape courses for
 * @param maxCourses Maximum number of courses to scrape in each batch (default: 10)
 * @param minNewCourses Minimum number of new courses to find (default: 5)
 * @returns Promise with newly added course data
 */
export async function scrapeMoreCourses(query: string, maxCourses: number = 10, minNewCourses: number = 5) {
  try {
    // Build URL with all parameters
    const params = new URLSearchParams({
      query,
      max_courses: maxCourses.toString(),
      min_new_courses: minNewCourses.toString()
    });
    
    const url = `${API_BASE_URL}/scrape-courses?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Scraped courses result:", data);
    
    return data;
  } catch (error) {
    console.error('Error scraping courses:', error);
    throw error;
  }
}

/**
 * Fetch a specific course by ID
 * @param courseId - The ID of the course to fetch
 * @returns Promise with course data
 */
export async function getCourseById(courseId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Fetch all platforms from the API
 * @returns Promise with platforms data
 */
export async function getPlatforms() {
  try {
    const response = await fetch(`${API_BASE_URL}/platforms`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching platforms:', error);
    throw error;
  }
}

/**
 * Fetch all available majors from the API
 * @returns Promise with majors data
 */
export async function getMajors() {
  try {
    const response = await fetch(`${API_BASE_URL}/majors`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching majors:', error);
    throw error;
  }
}

/**
 * Fetch all available skills from the API
 * @returns Promise with skills data
 */
export async function getSkills() {
  try {
    const response = await fetch(`${API_BASE_URL}/skills`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }
}

/**
 * Get all bookmarked courses for a user
 * @param userId - The ID of the user
 * @returns Promise with bookmarked courses data
 */
export async function getUserBookmarks(userId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookmarks?user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
}

/**
 * Add a course to user's bookmarks
 * @param userId - The ID of the user
 * @param courseId - The ID of the course to bookmark
 * @returns Promise with success message
 */
export async function addBookmark(userId: number, courseId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, course_id: courseId }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

/**
 * Remove a course from user's bookmarks
 * @param userId - The ID of the user
 * @param courseId - The ID of the course to remove from bookmarks
 * @returns Promise with success message
 */
export async function removeBookmark(userId: number, courseId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookmarks?user_id=${userId}&course_id=${courseId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

/**
 * Fetch all institutions from the API
 * @returns Promise with institutions data
 */
export async function getInstitutions() {
  try {
    const response = await fetch(`${API_BASE_URL}/institutions`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
}

// --- User Profile Functions ---

/**
 * User Profile data structure
 */
export interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  level?: string | null; // Optional fields
  major?: string | null; // Optional fields
}

/**
 * Fetch user profile details
 * @param userId - The ID of the user
 * @returns Promise with user profile data
 */
export async function getUserDetails(userId: number): Promise<UserProfile> {
  try {
    console.log("Fetching user details for user:", userId);
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        throw new Error(`Error: ${response.status} - ${errorData.error || 'Failed to fetch user details'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user details for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user profile details
 * @param userId - The ID of the user
 * @param data - Object containing fields to update (e.g., { first_name: 'New', level: 'Intermediate' })
 * @returns Promise with the updated user profile data
 */
export async function updateUserDetails(userId: number, data: Partial<UserProfile>): Promise<{ message: string; user: UserProfile }> {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${responseData.error || 'Failed to update profile'}`);
        }

        return responseData;
    } catch (error) {
        console.error(`Error updating user details for user ${userId}:`, error);
        throw error;
    }
} 