"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Updated schema with first/last names and password validation
const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string()
              .min(8, { message: "Password must be at least 8 characters." })
              // Regex requires at least one number and one special character
              .regex(/^(?=.*\d)(?=.*[^\w\s]).{8,}$/,
                     "Password must include at least one number and one special character."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Set the error path to confirmPassword field
});

export default function SignUpPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
     mode: "onChange", // Show validation errors sooner
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Show loading state
      console.log("Processing sign up...");
      
      // Store form data in localStorage to use in the next step
      if (typeof window !== "undefined") {
        localStorage.setItem("signupFirstName", values.firstName);
        localStorage.setItem("signupLastName", values.lastName);
        localStorage.setItem("signupEmail", values.email);
        localStorage.setItem("signupPassword", values.password);
      }
      
      // Navigate to additional info page
      router.push("/auth/sign-up/additional-info");
    } catch (error) {
      console.error("Error during signup:", error);
      form.setError("root", { 
        message: "An unexpected error occurred. Please try again."
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8"> {/* Added py-8 for padding */}
      {/* Increased card width */}
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Added First Name and Last Name fields in a grid */}
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              {/* Email Field (unchanged) */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Confirm Password Field */}
               <FormField
                 control={form.control}
                 name="confirmPassword"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Confirm Password</FormLabel>
                     <FormControl>
                       <Input type="password" placeholder="********" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
              <Button type="submit" className="w-full">Next</Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground"> {/* Increased margin-top */} 
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 