// API utility functions for interacting with the backend

const API_BASE_URL = 'http://localhost:5050/api';

interface FilterParams {
  difficulty?: string;
  major?: string;
  platform_id?: number;
  min_price?: number;
  max_price?: number;
  skill_id?: number;
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
      if (filters.major) params.append('major', filters.major);
      if (filters.platform_id) params.append('platform_id', filters.platform_id.toString());
      if (filters.min_price) params.append('min_price', filters.min_price.toString());
      if (filters.max_price) params.append('max_price', filters.max_price.toString());
      if (filters.skill_id) params.append('skill_id', filters.skill_id.toString());
      
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
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