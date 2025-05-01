"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, ArrowLeft, Star, Users, Building, Globe } from "lucide-react";
import { Course, getUserBookmarks, removeBookmark } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("User not logged in");
          setIsLoading(false);
          return;
        }

        const courses = await getUserBookmarks(parseInt(userId));
        setBookmarkedCourses(courses);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        setError("Failed to load bookmarks. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (courseId: number) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User not logged in");
        return;
      }

      await removeBookmark(parseInt(userId), courseId);
      // Update state to reflect removal
      setBookmarkedCourses(prevCourses => 
        prevCourses.filter(course => course.course_id !== courseId)
      );
    } catch (err) {
      console.error("Error removing bookmark:", err);
      setError("Failed to remove bookmark. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading bookmarks...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center">
          <Bookmark className="mr-3 h-6 w-6" /> Your Bookmarked Courses
        </h1>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </header>

      {/* Bookmarked Courses Grid */}
      {bookmarkedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarkedCourses.map((course) => (
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
                      Platform: {course.platform.name || "N/A"}
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
                  className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => handleRemoveBookmark(course.course_id)}
                  aria-label="Remove bookmark"
                >
                  <Bookmark className="h-5 w-5 fill-primary text-primary" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You haven't bookmarked any courses yet.</p>
          <Link href="/dashboard">
            <Button variant="link" className="mt-4">Browse Courses</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 