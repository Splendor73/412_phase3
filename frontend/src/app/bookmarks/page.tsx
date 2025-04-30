"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, ArrowLeft } from "lucide-react";

// Ideally, move mock data to a shared file (e.g., lib/data.ts)
import { mockCourses, platforms } from "@/app/dashboard/page";
import { getBookmarks, removeBookmark, isBookmarked } from "@/lib/bookmarks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

// Define a type for the course structure
type Course = (typeof mockCourses)[number];

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bookmarkIds = getBookmarks();
    const courses = mockCourses.filter(course => bookmarkIds.includes(course.course_id));
    setBookmarkedCourses(courses);
    setIsLoading(false);
  }, []);

  // Handler to remove bookmark AND update UI
  const handleRemoveBookmark = (courseId: number) => {
    removeBookmark(courseId);
    // Update state to reflect removal
    setBookmarkedCourses(prevCourses => prevCourses.filter(course => course.course_id !== courseId));
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading bookmarks...</div>;
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarkedCourses.map((course) => (
            <Card key={course.course_id} className="flex flex-col relative"> 
               {/* Remove Bookmark Button */}
               <Button 
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                    onClick={() => handleRemoveBookmark(course.course_id)}
                    aria-label="Remove bookmark"
                >
                    {/* Use filled icon as it's already bookmarked */}
                    <Bookmark className="h-5 w-5 fill-destructive text-destructive" />
                </Button>

               <CardHeader className="pt-8"> 
                 <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="text-sm pt-1 h-16 overflow-hidden text-ellipsis">
                    {course.description || "No description available."}
                  </CardDescription>
               </CardHeader>
               <CardContent className="flex-grow space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {/* Re-add color coding logic for difficulty */}
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
                    {course.platform_id && <Badge variant="outline">{platforms.find(p => p.id === course.platform_id)?.name}</Badge>}
                  </div>
               </CardContent>
               <CardFooter className="flex justify-between items-center pt-4">
                  <span className="text-lg font-semibold">
                     {course.price ? `$${course.price.toFixed(2)}` : "Free"}
                  </span>
                  <Link href={`/course/${course.course_id}`}>
                     <Button size="sm">View</Button>
                  </Link>
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