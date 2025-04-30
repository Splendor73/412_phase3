const BOOKMARK_KEY = "bookmarkedCourses";

// Type guard for localStorage availability
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = "__testLocalStorage__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const getBookmarks = (): number[] => {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available. Bookmarks will not persist.");
    return [];
  }
  const storedBookmarks = localStorage.getItem(BOOKMARK_KEY);
  return storedBookmarks ? JSON.parse(storedBookmarks) : [];
};

export const setBookmarks = (bookmarks: number[]): void => {
   if (!isLocalStorageAvailable()) return;
   localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
};

export const addBookmark = (courseId: number): void => {
  const bookmarks = getBookmarks();
  if (!bookmarks.includes(courseId)) {
    setBookmarks([...bookmarks, courseId]);
  }
};

export const removeBookmark = (courseId: number): void => {
  const bookmarks = getBookmarks();
  setBookmarks(bookmarks.filter(id => id !== courseId));
};

export const isBookmarked = (courseId: number): boolean => {
  return getBookmarks().includes(courseId);
}; 