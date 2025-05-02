"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // For displaying difficulty/major
import {
  Search,
  Filter,
  DollarSign,
  Bookmark,
  Star,
  Users,
  Building,
  Globe,
  ArrowUpDown,
  Sparkles,
  RotateCcw,
  User,
  LogOut,
} from "lucide-react"; // Icons
import Link from "next/link"; // Add Link import
import {
  getCourses,
  getPlatforms,
  getInstitutions,
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  scrapeMoreCourses,
  Course,
  Platform,
  Skill,
  skillLevels,
  Institution,
} from "@/lib/api"; // Import the API functions
import { withAuth } from "@/components/auth/auth-provider";

// --- Component ---

function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [allCourses, setAllCourses] = useState<Course[]>([]); // Store all courses initially
  const [courses, setCourses] = useState<Course[]>([]); // Filtered/displayed courses
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]); // Changed state name
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [bookmarks, setBookmarksState] = useState<number[]>([]);
  const [loadingMoreCourses, setLoadingMoreCourses] = useState(false);

  useEffect(() => {
    // Fetch user name and initial bookmarks
    const storedName = localStorage.getItem("userFirstName");
    const userId = localStorage.getItem("userId");
    const userLevel = localStorage.getItem("userLevel");

    if (storedName) {
      setUserName(storedName);
    } else {
      console.warn("User name not found in localStorage.");
    }

    // --- Pre-fill filters from localStorage ---
    if (userLevel && skillLevels.includes(userLevel as any)) {
      // Check if level is valid
      // setSelectedDifficulty(userLevel);
    }
    // --- End Pre-fill ---

    // Load initial data
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch courses, platforms, and institutions
        const [
          coursesData,
          platformsData,
          institutionsData,
        ] = await Promise.all([
          getCourses(), // Fetch all courses initially without filters
          getPlatforms(),
          getInstitutions(), // Fetch institutions
        ]);

        setAllCourses(coursesData); // Store all courses
        setCourses(coursesData); // Set initial display courses
        setPlatforms(platformsData);
        setInstitutions(institutionsData); // Store institutions

        console.log("Fetched Courses Data:", coursesData); // Log fetched data

        const allSkills = coursesData.flatMap(
          (course: Course) => course.skills || []
        ); // Add Course type
        const uniqueSkillsMap = new Map<number, Skill>();
        allSkills.forEach((skill: Skill) => {
          if (!uniqueSkillsMap.has(skill.skill_id)) {
            uniqueSkillsMap.set(skill.skill_id, skill);
          }
        });
        setAvailableSkills(Array.from(uniqueSkillsMap.values()));
        // --- End Derivation ---

        // Fetch bookmarks if user is logged in
        if (userId) {
          const bookmarkedCourses = await getUserBookmarks(parseInt(userId));
          setBookmarksState(
            bookmarkedCourses.map((course: Course) => course.course_id)
          );
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Run only once on mount

  // Update courses when filters change
  useEffect(() => {
    // Skip filtering if loading initial data or if allCourses isn't populated yet
    if (loading || allCourses.length === 0) return;

    const applyFilters = () => {
      let filtered = [...allCourses]; // Start with all courses

      // Apply filters locally
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (course) =>
            course.title.toLowerCase().includes(lowerSearchTerm) ||
            (course.description &&
              course.description.toLowerCase().includes(lowerSearchTerm))
        );
      }
      if (selectedDifficulty !== "all") {
        filtered = filtered.filter(
          (course) => course.difficulty === selectedDifficulty
        );
      }
      if (selectedPlatform !== "all") {
        const platformId = parseInt(selectedPlatform);
        filtered = filtered.filter(
          (course) => course.platform.platform_id === platformId
        );
      }
      if (selectedSkill !== "all") {
        const skillId = parseInt(selectedSkill);
        filtered = filtered.filter((course) =>
          course.skills?.some((skill: Skill) => skill.skill_id === skillId)
        );
      }
      if (selectedInstitution !== "all") {
        const institutionId = parseInt(selectedInstitution);
        filtered = filtered.filter(
          (course) => course.institution?.institution_id === institutionId
        );
      }

      // Apply sorting locally
      switch (sortBy) {
        case "rating_desc":
          filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          break;
        case "rating_asc":
          filtered.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
          break;
        case "enrollment_desc":
          filtered.sort(
            (a, b) => (b.num_enrollments ?? 0) - (a.num_enrollments ?? 0)
          );
          break;
        case "enrollment_asc":
          filtered.sort(
            (a, b) => (a.num_enrollments ?? 0) - (b.num_enrollments ?? 0)
          );
          break;
        // Add more cases if needed (e.g., title, difficulty)
        default:
          // Optional: default sort (e.g., by ID or title)
          // filtered.sort((a, b) => a.course_id - b.course_id);
          break;
      }

      setCourses(filtered);
    };

    // Debounce filter application
    const debounceTimeout = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout); // Cleanup timeout
  }, [
    searchTerm,
    selectedDifficulty,
    selectedPlatform,
    selectedSkill,
    selectedInstitution,
    sortBy,
    allCourses,
    loading,
  ]); // Dependencies include filters and allCourses

  // Handler to reset all filters and sorting
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDifficulty("all");
    setSelectedPlatform("all");
    setSelectedInstitution("all");
    setSelectedSkill("all");
    setSortBy("default");
  };

  // Handler for the "Picked for You" button
  const handlePickedForYou = () => {
    const userLevel = localStorage.getItem("userLevel");

    // Reset other filters to ensure a clean slate
    setSearchTerm("");
    setSelectedPlatform("all");
    setSelectedSkill("all");
    setSelectedInstitution("all");

    // Apply user-specific filters and sorting
    if (userLevel && skillLevels.includes(userLevel as any)) {
      setSelectedDifficulty(userLevel);
    } else {
      setSelectedDifficulty("all"); // Default if no valid level
      console.warn(
        "User level not found or invalid in localStorage, defaulting difficulty to 'all'."
      );
    }

    setSortBy("rating_desc"); // Sort by best rating
  };

  const handleSignOut = () => {
    console.log("Signing out...");
    if (typeof window !== "undefined") {
      // Clear all authentication-related data
      localStorage.removeItem("userFirstName");
      localStorage.removeItem("userLastName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("userType");
      localStorage.removeItem("userMajor");
      localStorage.removeItem("userLevel");
    }
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
      setBookmarksState((prev) => {
        const newState = isCurrentlyBookmarked
          ? prev.filter((id) => id !== courseId)
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
          {/* Profile Button */}
          <Link href="/profile">
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
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

        {/* "Picked for You" Button Row */}
        <div className="flex flex-wrap gap-3 items-center mt-4">
          <Button
              onClick={handlePickedForYou}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Picked for You
          </Button>
          {/* Reset Button */}
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="text-sm h-9"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center mt-4">
          {" "}
          {/* Adjusted margin */}
          <Filter className="h-5 w-5 text-muted-foreground mr-1" />
          <span className="text-sm font-medium mr-2">Filters:</span>
          {/* Difficulty Filter */}
          <Select
            value={selectedDifficulty}
            onValueChange={setSelectedDifficulty}
          >
            <SelectTrigger className="w-auto text-sm h-9">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {skillLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
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
              {platforms.map((platform) => (
                <SelectItem
                  key={platform.platform_id}
                  value={platform.platform_id.toString()}
                >
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Institution Filter */}
          <Select
            value={selectedInstitution}
            onValueChange={setSelectedInstitution}
          >
            <SelectTrigger className="w-auto text-sm h-9">
              <SelectValue placeholder="Institution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Institutions</SelectItem>
              {institutions.map((inst) => (
                <SelectItem
                  key={inst.institution_id}
                  value={inst.institution_id.toString()}
                >
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Skill Filter */}
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {availableSkills.map((skill) => (
                <SelectItem
                  key={skill.skill_id}
                  value={skill.skill_id.toString()}
                >
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sorting Row */}
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <ArrowUpDown className="h-5 w-5 text-muted-foreground mr-1" />
          <span className="text-sm font-medium mr-2">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-auto text-sm h-9">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
              <SelectItem value="rating_asc">Rating (Low to High)</SelectItem>
              <SelectItem value="enrollment_desc">
                Enrollments (High to Low)
              </SelectItem>
              <SelectItem value="enrollment_asc">
                Enrollments (Low to High)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-8 gap-4">
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
            <p className="text-gray-500 mb-3">
              No courses found matching your criteria.
            </p>
            {searchTerm.trim() !== "" ? (
              <>
                <p className="text-gray-500 mb-4">
                  Our database doesn't currently have courses matching "{searchTerm}". 
                  <br />Click below to search for courses online!
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out"
                  onClick={async () => {
                    try {
                      setLoadingMoreCourses(true);
                      console.log("Scraping courses for search term:", searchTerm);
                      
                      // Call the API to scrape more courses
                      const result = await scrapeMoreCourses(searchTerm, 10, 5);
                      
                      if (result.courses && result.courses.length > 0) {
                        // Add new courses to both state arrays
                        setAllCourses(prev => [...prev, ...result.courses]);
                        
                        // Apply current filters to the new courses
                        let newFilteredCourses = [...result.courses];
                        
                        // Apply difficulty filter if selected
                        if (selectedDifficulty !== "all") {
                          newFilteredCourses = newFilteredCourses.filter(
                            course => course.difficulty === selectedDifficulty
                          );
                        }
                        
                        // Apply platform filter if selected
                        if (selectedPlatform !== "all") {
                          const platformId = parseInt(selectedPlatform);
                          newFilteredCourses = newFilteredCourses.filter(
                            course => course.platform.platform_id === platformId
                          );
                        }
                        
                        // Apply institution filter if selected
                        if (selectedInstitution !== "all") {
                          const institutionId = parseInt(selectedInstitution);
                          newFilteredCourses = newFilteredCourses.filter(
                            course => course.institution?.institution_id === institutionId
                          );
                        }
                        
                        // Apply skill filter if selected
                        if (selectedSkill !== "all") {
                          const skillId = parseInt(selectedSkill);
                          newFilteredCourses = newFilteredCourses.filter(
                            course => course.skills?.some((skill: Skill) => skill.skill_id === skillId)
                          );
                        }
                        
                        // Add filtered new courses to current courses
                        setCourses(prev => [...prev, ...newFilteredCourses]);
                        
                        // Show success toast/notification
                        const displayCount = newFilteredCourses.length;
                        const totalCount = result.courses.length;
                        
                        if (displayCount === totalCount) {
                          alert(`Added ${displayCount} new courses!`);
                        } else {
                          alert(`Added ${displayCount} new courses matching your filters! (${totalCount - displayCount} were filtered out)`);
                        }
                      } else {
                        alert("No courses found online. Try a different search term.");
                      }
                    } catch (error) {
                      console.error("Failed to load courses:", error);
                      alert("Failed to search for courses online. Please try again later.");
                    } finally {
                      setLoadingMoreCourses(false);
                    }
                  }}
                  disabled={loadingMoreCourses}
                >
                  {loadingMoreCourses ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Searching for courses online...
                    </span>
                  ) : (
                    "Find Courses Online"
                  )}
                </Button>
              </>
            ) : (
              <p className="text-gray-400">Try adjusting your filters or enter a search term.</p>
            )}
          </div>
        ) : (
          // Display actual courses
          courses.map((course) => {
            const bookmarked = bookmarks.includes(course.course_id);
            return (
              <Card
                key={course.course_id}
                className="flex flex-col relative overflow-hidden hover:shadow-lg transition-shadow duration-200 gap-2"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg mb-1">{course.title}</CardTitle>
                  <CardDescription className="text-sm pt-0 h-5 overflow-hidden text-ellipsis line-clamp-2 mb-0">
                    {course.description || "No description available."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 pt-2 pb-3">
                  {course.difficulty && (
                    <Badge
                      variant="secondary"
                      className={`
                        w-fit text-xs font-medium px-2.5 py-0.5 rounded-full
                        ${
                          course.difficulty === "Beginner"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-700"
                            : ""
                        }
                        ${
                          course.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"
                            : ""
                        }
                        ${
                          course.difficulty === "Advanced"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-700"
                            : ""
                        }
                      `}
                    >
                      {course.difficulty}
                    </Badge>
                  )}

                  {course.rating !== undefined && course.rating !== null && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {course.num_enrollments !== undefined &&
                    course.num_enrollments !== null && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {course.num_enrollments.toLocaleString()} enrolled
                        </span>
                      </div>
                    )}

                  {course.platform && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>
                        Platform:{" "}
                        {platforms.find(
                          (p) => p.platform_id === course.platform.platform_id
                        )?.name || "N/A"}
                      </span>
                    </div>
                  )}

                  {course.institution && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>
                        Institution: {course.institution.name || "N/A"}
                      </span>
                    </div>
                  )}

                  {course.skills && course.skills.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Skills:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {course.skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill.skill_id}
                            variant="outline"
                            className="text-xs px-2 py-0.5"
                          >
                            {skill.name}
                          </Badge>
                        ))}
                        {course.skills.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5"
                          >
                            ...
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 pb-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <Link
                    href={course.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow"
                  >
                    <Button variant="outline" className="w-full h-8 text-sm">
                      View Course
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0"
                    onClick={() => toggleBookmark(course.course_id)}
                    aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${
                        bookmarked ? "fill-primary text-primary" : ""
                      }`}
                    />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Load More Courses Button */}
      {courses.length > 0 && !loading && !error && searchTerm.trim() !== "" && (
        <div className="flex justify-center mt-8">
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out"
            onClick={async () => {
              try {
                setLoadingMoreCourses(true);
                console.log("Scraping more courses for search term:", searchTerm);
                
                // Call the API to scrape more courses
                // Initial batch size of 10, with a minimum of 5 new courses
                const result = await scrapeMoreCourses(searchTerm, 10, 5);
                
                if (result.courses && result.courses.length > 0) {
                  // Add new courses to both state arrays
                  setAllCourses(prev => [...prev, ...result.courses]);
                  
                  // Apply current filters to the new courses
                  let newFilteredCourses = [...result.courses];
                  
                  // Apply difficulty filter if selected
                  if (selectedDifficulty !== "all") {
                    newFilteredCourses = newFilteredCourses.filter(
                      course => course.difficulty === selectedDifficulty
                    );
                  }
                  
                  // Apply platform filter if selected
                  if (selectedPlatform !== "all") {
                    const platformId = parseInt(selectedPlatform);
                    newFilteredCourses = newFilteredCourses.filter(
                      course => course.platform.platform_id === platformId
                    );
                  }
                  
                  // Apply institution filter if selected
                  if (selectedInstitution !== "all") {
                    const institutionId = parseInt(selectedInstitution);
                    newFilteredCourses = newFilteredCourses.filter(
                      course => course.institution?.institution_id === institutionId
                    );
                  }
                  
                  // Apply skill filter if selected
                  if (selectedSkill !== "all") {
                    const skillId = parseInt(selectedSkill);
                    newFilteredCourses = newFilteredCourses.filter(
                      course => course.skills?.some((skill: Skill) => skill.skill_id === skillId)
                    );
                  }
                  
                  // Add filtered new courses to current courses
                  setCourses(prev => [...prev, ...newFilteredCourses]);
                  
                  // Show success toast/notification instead of alert
                  const displayCount = newFilteredCourses.length;
                  const totalCount = result.courses.length;
                  
                  if (displayCount === totalCount) {
                    alert(`Added ${displayCount} new courses!`);
                  } else {
                    alert(`Added ${displayCount} new courses matching your filters! (${totalCount - displayCount} were filtered out)`);
                  }
                } else {
                  alert("No new courses found. Try a different search term.");
                }
              } catch (error) {
                console.error("Failed to load more courses:", error);
                alert("Failed to load more courses. Please try again later.");
              } finally {
                setLoadingMoreCourses(false);
              }
            }}
            disabled={loadingMoreCourses}
          >
            {loadingMoreCourses ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Searching for new courses...
              </span>
            ) : (
              "Load More Courses"
            )}
          </Button>
        </div>
      )}

    </div>
  );
}

// Export the protected component
export default withAuth(DashboardPage);
