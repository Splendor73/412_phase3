"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark } from "lucide-react";
import { getBookmarks, addBookmark, removeBookmark, isBookmarked } from "@/lib/bookmarks";

// Ideally, move mock data to a shared file (e.g., lib/data.ts)
// For now, importing directly from dashboard
// Use named imports for the exported constants
import { mockCourses, platforms } from "@/app/dashboard/page";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Use Separator for visual division

// Define a type for the course structure (could be more precise)
type Course = (typeof mockCourses)[number];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [prerequisites, setPrerequisites] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCourseBookmarked, setIsCourseBookmarked] = useState(false);

  useEffect(() => {
    const courseIdParam = params.courseId;
    let courseId: number | null = null;

    if (!courseIdParam) {
      setError("Course ID is missing.");
      setIsLoading(false);
      return;
    }

    const parsedId = parseInt(Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam, 10);

    if (isNaN(parsedId)) {
      setError("Invalid Course ID format.");
      setIsLoading(false);
      return;
    }
    courseId = parsedId;

    // Find the course in mock data
    const foundCourse = mockCourses.find(c => c.course_id === courseId);

    if (foundCourse) {
      setCourse(foundCourse);
      setIsCourseBookmarked(isBookmarked(courseId));

      // Find prerequisites details
      if (foundCourse.prerequisite_course_ids && foundCourse.prerequisite_course_ids.length > 0) {
        const prereqs = foundCourse.prerequisite_course_ids
          .map(prereqId => mockCourses.find(c => c.course_id === prereqId))
          .filter((c): c is Course => c !== undefined); // Type guard to filter out undefined
        setPrerequisites(prereqs);
      }
    } else {
      setError("Course not found.");
    }

    setIsLoading(false);
  }, [params.courseId]);

  // Bookmark Toggle Handler
  const toggleBookmark = () => {
    if (!course) return;
    const courseId = course.course_id;
    if (isCourseBookmarked) {
      removeBookmark(courseId);
    } else {
      addBookmark(courseId);
    }
    // Update local state
    setIsCourseBookmarked(!isCourseBookmarked);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading course details...</div>;
  }

  if (error) {
    return (
        <div className="p-8 text-center text-destructive">
            <p>{error}</p>
            <Button onClick={() => router.push('/dashboard')} variant="link" className="mt-4">Back to Courses</Button>
        </div>
    );
  }

  if (!course) {
    // This case should technically be covered by error state, but good as a fallback
    return <div className="p-8 text-center">Course data could not be loaded.</div>;
  }

  // Find platform name
  const platform = platforms.find(p => p.id === course.platform_id);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-6">
         <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl mb-2">{course.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
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
                {platform && <Badge variant="outline">{platform.name}</Badge>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
               <span className="text-2xl font-bold block mb-1">
                  {course.price ? `$${course.price.toFixed(2)}` : "Free"}
                </span>
               {course.duration && <p className="text-sm text-muted-foreground">Duration: {course.duration}</p>}
            </div>
          </div>
          <Button 
             variant="outline"
             size="icon"
             className="mt-4 h-9 w-9"
             onClick={toggleBookmark}
             aria-label={isCourseBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className={`h-5 w-5 ${isCourseBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />

          <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
             <h3 className="text-xl font-semibold mb-2">Description</h3>
             <p>{course.description || "No description available."}</p>

             {/* --- Prerequisites Section --- */} 
             <Separator className="my-6" />
             <h3 className="text-xl font-semibold mb-3">Prerequisites</h3>
             {prerequisites.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                    {prerequisites.map(prereq => (
                        <li key={prereq.course_id}>
                            {/* Link to the prerequisite course page */}
                            <Link href={`/course/${prereq.course_id}`} className="text-primary underline hover:no-underline">
                               {prereq.title}
                            </Link>
                        </li>
                    ))}
                </ul>
             ) : (
                <p className="text-muted-foreground italic">None required.</p>
             )}
             {/* --- End Prerequisites --- */} 

              {/* --- Add other sections later (e.g., Syllabus, Instructor) --- */}
             <Separator className="my-6" />

             <div className="flex justify-center mt-8">
                <Button size="lg">Enroll Now (Placeholder)</Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 