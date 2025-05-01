"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // For displaying difficulty/major
import { Search, Filter, DollarSign, Bookmark } from "lucide-react"; // Icons
import Link from "next/link"; // Add Link import
import { getCourses, getPlatforms, getMajors, getSkills, addBookmark, removeBookmark, getUserBookmarks } from "@/lib/api"; // Import the API functions

// --- Mock Data --- 

// Re-use majors from sign-up (consider moving to a shared constants file later)
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

export const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;
export const platforms = [
    { id: 1, name: "Coursera" },
    { id: 2, name: "Udemy" },
    { id: 3, name: "EdX" },
    { id: 4, name: "Internal" }
] as const;

// Mock Course Data based on schema 
export const mockCourses = [
  {
    course_id: 101,
    title: "Introduction to React",
    description: "Learn the fundamentals of React, including components, state, and props.",
    price: 49.99,
    duration: "6 Weeks",
    difficulty: "Beginner",
    platform_id: 1,
    major: "Computer Science",
    // No prerequisites for this one
  },
  {
    course_id: 102,
    title: "Advanced Python Programming",
    description: "Dive deep into advanced Python topics like decorators, generators, and concurrency.",
    price: 99.99,
    duration: "8 Weeks",
    difficulty: "Advanced",
    platform_id: 2,
    major: "Computer Science",
    prerequisite_course_ids: [101] // Added prerequisite
  },
  {
    course_id: 103,
    title: "Marketing Fundamentals",
    description: "Understand the core principles of marketing, market research, and branding.",
    price: 29.99,
    duration: "4 Weeks",
    difficulty: "Beginner",
    platform_id: 1,
    major: "Marketing",
  },
  {
    course_id: 104,
    title: "Mechanical Engineering: Thermodynamics",
    description: "Explore the laws of thermodynamics and their application in engineering.",
    price: 79.99,
    duration: "10 Weeks",
    difficulty: "Intermediate",
    platform_id: 3,
    major: "Mechanical Engineering",
  },
  {
    course_id: 105,
    title: "Introduction to Finance",
    description: "Learn about financial markets, investments, and corporate finance.",
    price: 60.00,
    duration: "5 Weeks",
    difficulty: "Beginner",
    platform_id: 4,
    major: "Finance",
  },
  // Add more mock courses as needed
];

// Add type definition for Course
interface Course {
  course_id: number;
  title: string;
  description: string;
  price: number | null;
  duration: string;
  difficulty: string;
  platform_id: number;
  major: string;
  platform_name: string;
}

// Add types for API responses
interface Platform {
  platform_id: number;
  name: string;
  website: string;
}

interface Skill {
  skill_id: number;
  name: string;
}

interface FilterParams {
  difficulty?: string;
  major?: string;
  platform_id?: number;
  min_price?: number;
  max_price?: number;
  skill_id?: number;
}

// --- Component --- 

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [bookmarks, setBookmarksState] = useState<number[]>([]);

  useEffect(() => {
    // Fetch user name and initial bookmarks
    const storedName = localStorage.getItem("userFirstName");
    const userId = localStorage.getItem("userId");
    
    if (storedName) {
      setUserName(storedName);
    } else {
      console.warn("User name not found in localStorage.");
    }
    
    // Load initial data
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [coursesData, platformsData, majorsData, skillsData] = await Promise.all([
          getCourses(),
          getPlatforms(),
          getMajors(),
          getSkills()
        ]);

        setCourses(coursesData);
        setPlatforms(platformsData);
        setMajors(majorsData);
        setSkills(skillsData);
        
        // Fetch bookmarks if user is logged in
        if (userId) {
          const bookmarkedCourses = await getUserBookmarks(parseInt(userId));
          setBookmarksState(bookmarkedCourses.map((course: Course) => course.course_id));
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Update courses when filters change
  useEffect(() => {
    const fetchFilteredCourses = async () => {
      try {
        setLoading(true);
        const filters: FilterParams = {};
        
        if (selectedDifficulty !== 'all') filters.difficulty = selectedDifficulty;
        if (selectedMajor !== 'all') filters.major = selectedMajor;
        if (selectedPlatform !== 'all') filters.platform_id = parseInt(selectedPlatform);
        if (selectedSkill !== 'all') filters.skill_id = parseInt(selectedSkill);
        if (minPrice) filters.min_price = parseFloat(minPrice);
        if (maxPrice) filters.max_price = parseFloat(maxPrice);
        
        const filteredCourses = await getCourses(filters);
        setCourses(filteredCourses);
      } catch (err) {
        console.error("Error fetching filtered courses:", err);
        setError("Failed to apply filters. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredCourses();
  }, [selectedDifficulty, selectedMajor, selectedPlatform, selectedSkill, minPrice, maxPrice]);

  const handleSignOut = () => {
    console.log("Signing out...");
    if (typeof window !== "undefined") {
        localStorage.removeItem("userFirstName"); // Clear stored name
    }
    // Optionally clear bookmarks on sign out?
    // localStorage.removeItem("bookmarkedCourses"); 
    router.push("/auth/sign-in");
  };

  // Bookmark Toggle Handler
  const toggleBookmark = async (courseId: number) => {
    try {
      const userId = localStorage.getItem("userId");
      console.log("Attempting to toggle bookmark:", { userId, courseId });
      
      if (!userId) {
        console.error("User not logged in");
        return;
      }

      const isCurrentlyBookmarked = bookmarks.includes(courseId);
      console.log("Is currently bookmarked:", isCurrentlyBookmarked);
      
      if (isCurrentlyBookmarked) {
        console.log("Removing bookmark...");
        await removeBookmark(parseInt(userId), courseId);
      } else {
        console.log("Adding bookmark...");
        await addBookmark(parseInt(userId), courseId);
      }
      
      // Update local state to re-render UI
      setBookmarksState(prev => {
        const newState = isCurrentlyBookmarked 
          ? prev.filter(id => id !== courseId)
          : [...prev, courseId];
        console.log("New bookmarks state:", newState);
        return newState;
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Hi, {userName}!</h1>
        <div className="flex gap-2">
             {/* Bookmarks Button */} 
            <Link href="/bookmarks">
                <Button variant="outline">
                   <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
                </Button>
            </Link>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
           <Input 
             placeholder="Search courses..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10 w-full md:w-1/2 lg:w-1/3"
           />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
           <Filter className="h-5 w-5 text-muted-foreground mr-1" />
           <span className="text-sm font-medium mr-2">Filters:</span>
            {/* Difficulty Filter */}
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-auto text-sm h-9">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {difficulties.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

             {/* Major Filter */}
            <Select value={selectedMajor} onValueChange={setSelectedMajor}>
              <SelectTrigger className="w-auto text-sm h-9">
                <SelectValue placeholder="Major" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Majors</SelectItem>
                {majors.map(major => (
                  <SelectItem key={major} value={major}>{major}</SelectItem>
                ))}
              </SelectContent>
            </Select>

             {/* Platform Filter */}
             <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-auto text-sm h-9">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform.platform_id} value={platform.platform_id.toString()}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Skills Filter */}
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-auto text-sm h-9">
                <SelectValue placeholder="Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {skills.map(skill => (
                  <SelectItem key={skill.skill_id} value={skill.skill_id.toString()}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Filter */}
             <div className="flex items-center gap-2 border rounded-md px-2 py-1 h-9">
                 <DollarSign className="h-4 w-4 text-muted-foreground" />
                 <Input 
                    type="number"
                    placeholder="Min $"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-7 w-20 border-none focus-visible:ring-0 text-sm p-1"
                    min="0"
                 />
                 <span className="text-muted-foreground">-</span>
                 <Input 
                    type="number"
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-7 w-20 border-none focus-visible:ring-0 text-sm p-1"
                    min="0"
                 />
             </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {loading ? (
          // Loading state
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="animate-pulse">
              <CardHeader className="h-32 bg-gray-200 dark:bg-gray-800 rounded-t-lg"></CardHeader>
              <CardContent className="py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : courses.length === 0 ? (
          // No results state
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-2">No courses found matching your criteria.</p>
            <p className="text-gray-400">Try adjusting your filters.</p>
          </div>
        ) : (
          // Display actual courses
          courses.map((course) => {
            const bookmarked = bookmarks.includes(course.course_id);
            return (
              <Card key={course.course_id} className="flex flex-col relative">
                  {/* Bookmark Toggle Button */} 
                  <Button 
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-primary z-10"
                      onClick={() => toggleBookmark(course.course_id)}
                      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                      <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                  
                  <CardHeader className="pt-8">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="text-sm pt-1 h-16 overflow-hidden text-ellipsis"> {course.description || "No description available."}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                      {/* <p className="text-sm text-muted-foreground">Duration: {course.duration}</p> */}
                      <div className="flex flex-wrap gap-2">
                         {course.difficulty && (
                              <Badge 
                                  variant="secondary"
                                  className={`
                                      ${course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700' : ''}
                                      ${course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700' : ''}
                                      ${course.difficulty === 'Advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700' : ''}
                                  `}
                              >
                                  {course.difficulty}
                              </Badge>
                          )}
                         {course.major && <Badge variant="outline">{course.major}</Badge>}
                         {course.platform_id && <Badge variant="outline">{platforms.find(p=>p.platform_id === course.platform_id)?.name}</Badge>}
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-4">
                      <span className="text-lg font-semibold">
                         {course.price ? `$${course.price.toFixed(2)}` : "Free"}
                      </span>
                      {/* Wrap Button in Link */}
                      <Link href={`/course/${course.course_id}`}>
                         <Button size="sm">View</Button> 
                      </Link>
                  </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 