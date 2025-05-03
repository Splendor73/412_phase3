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
import Link from "next/link"; // Import Link
import { API_BASE_URL } from "@/lib/api";
import { withAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

function SignInPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(API_BASE_URL + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Login failed:", data.message);
        form.setError("root", { 
          message: data.message || "Login failed. Please check your credentials."
        });
        toast.error("Login failed", {
          description: data.message || "Please check your credentials and try again"
        });
        return;
      }
      
      const user = data.user;
      if (typeof window !== "undefined") {
        localStorage.setItem("userFirstName", user.firstName);
        localStorage.setItem("userLastName", user.lastName);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userId", user.id.toString());
        localStorage.setItem("userType", user.type);
        localStorage.setItem("userMajor", user.major);
        localStorage.setItem("userLevel", user.skillLevel);
      }
      
      toast.success("Login successful", {
        description: `Welcome back, ${user.firstName}!`
      });
      
      // Redirect to the dashboard
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error during login:", error);
      form.setError("root", { 
        message: "An unexpected error occurred. Please try again."
      });
      toast.error("Sign in error", {
        description: "An unexpected error occurred. Please try again."
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="underline">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(SignInPage, { redirectIfAuthenticated: true }); 