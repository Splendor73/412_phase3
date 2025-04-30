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
import { getBookmarks, addBookmark, removeBookmark, isBookmarked } from "@/lib/bookmarks";

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

// --- Component --- 

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter States
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all"); // Default to all
  const [selectedMajor, setSelectedMajor] = useState<string>("all"); // Default to all
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all"); // Default to all
  // Add states for price filter
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  // Add state for skill filters later

  // Bookmark State
  const [bookmarks, setBookmarksState] = useState<number[]>([]);

  useEffect(() => {
    // Fetch user name and initial bookmarks
    const storedName = localStorage.getItem("userFirstName");
    if (storedName) {
      setUserName(storedName);
    } else {
      // Handle case where name isn't found (e.g., direct navigation without login)
      // Maybe redirect back to login or show a default state
      console.warn("User name not found in localStorage.");
      // Optional: redirect back
      // router.push("/auth/sign-in"); 
    }
    // Load bookmarks on mount
    setBookmarksState(getBookmarks());
  }, []);

  const handleSignOut = () => {
    console.log("Signing out...");
    if (typeof window !== "undefined") {
        localStorage.removeItem("userFirstName"); // Clear stored name
    }
    // Optionally clear bookmarks on sign out?
    // localStorage.removeItem("bookmarkedCourses"); 
    router.push("/auth/sign-in");
  };

  // Client-side filtering logic
  const filteredCourses = mockCourses.filter(course => {
    const titleMatch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const difficultyMatch = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
    const majorMatch = selectedMajor === 'all' || course.major === selectedMajor;
    const platformMatch = selectedPlatform === 'all' || course.platform_id?.toString() === selectedPlatform;
    
    // Price filtering logic
    const minPriceNum = parseFloat(minPrice);
    const maxPriceNum = parseFloat(maxPrice);
    const coursePrice = course.price ?? 0; // Treat null/undefined price as 0 for comparison

    const minPriceMatch = isNaN(minPriceNum) || coursePrice >= minPriceNum;
    const maxPriceMatch = isNaN(maxPriceNum) || coursePrice <= maxPriceNum;

    // Add skill match later

    return titleMatch && difficultyMatch && majorMatch && platformMatch && minPriceMatch && maxPriceMatch;
  });

  // Bookmark Toggle Handler
  const toggleBookmark = (courseId: number) => {
      if (isBookmarked(courseId)) {
          removeBookmark(courseId);
      } else {
          addBookmark(courseId);
      }
      // Update local state to re-render UI
      setBookmarksState(getBookmarks());
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
                  <SelectItem key={platform.id} value={platform.id.toString()}>{platform.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Filters */}
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

            {/* Placeholder Filters (Skills) */}
            <Button variant="outline" size="sm" className="h-9 text-sm" disabled>Skills</Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => {
              const bookmarked = isBookmarked(course.course_id);
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
                           {course.platform_id && <Badge variant="outline">{platforms.find(p=>p.id === course.platform_id)?.name}</Badge>}
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
         ) : (
            <p className="col-span-full text-center text-muted-foreground">No courses found matching your criteria.</p>
         )}
      </div>
    </div>
  );
} 