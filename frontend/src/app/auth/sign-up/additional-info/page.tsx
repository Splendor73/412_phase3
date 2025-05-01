"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL, majors, skillLevels } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface Skill {
  skill_id: number;
  name: string;
}

interface UISkill {
  id: string;
  label: string;
}

const formSchema = z.object({
  major: z.enum(majors, { required_error: "Major is required." }),
  skillLevel: z.enum(skillLevels, { required_error: "Skill level is required."}),
  skills: z.array(z.string()).refine((value) => value.length > 0, {
    message: "Please select at least one skill you want to learn.",
  }),
});

export default function AdditionalInfoPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [skillSearchTerm, setSkillSearchTerm] = useState("");

  const [allSkills, setAllSkills] = useState<UISkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [fetchSkillsError, setFetchSkillsError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
        const storedFirstName = localStorage.getItem("signupFirstName");
        const storedLastName = localStorage.getItem("signupLastName");
        const storedEmail = localStorage.getItem("signupEmail");
        const storedPassword = localStorage.getItem("signupPassword");
        if (!storedFirstName || !storedLastName || !storedEmail || !storedPassword) {
          console.warn("Missing sign-up data, redirecting back.")
          router.push("/auth/sign-up");
        } else {
          setFirstName(storedFirstName);
          setLastName(storedLastName);
          setEmail(storedEmail);
          setPassword(storedPassword);
        }
    }

    const fetchSkills = async () => {
      setIsLoadingSkills(true);
      setFetchSkillsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/skills`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Skill[] = await response.json();
        const uiSkills = data.map(skill => ({
          id: skill.skill_id.toString(),
          label: skill.name,
        }));
        setAllSkills(uiSkills);
      } catch (error) {
        console.error("Failed to fetch skills:", error);
        setFetchSkillsError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setIsLoadingSkills(false);
      }
    };

    fetchSkills();

  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      major: undefined,
      skills: [],
      skillLevel: undefined,
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firstName || !lastName || !email || !password) {
        console.error("Required sign-up data missing from state");
        router.push("/auth/sign-up");
        return;
    }

    try {
      console.log("Completing sign up...");

      const selectedSkillLabels = values.skills.map((skillId: string) => {
        const skill = allSkills.find(s => s.id === skillId);
        return skill ? skill.label : skillId;
      });

      const signupData = {
        firstName,
        lastName,
        email,
        password,
        type: 'student',
        major: values.major,
        skillLevel: values.skillLevel,
        learningGoals: selectedSkillLabels.join(', ')
      };

      console.log("Sending registration data to API:", signupData);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      console.log("Registration response status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("Registration response data:", data);
      } catch (jsonError) {
        console.error("Failed to parse response JSON:", jsonError);
        const responseText = await response.text();
        console.log("Response text:", responseText);
        form.setError("root", {
          message: "Server error: Failed to parse response. Check console for details."
        });
        return;
      }
      
      if (!response.ok) {
        console.error("Registration failed:", data.message);
        form.setError("root", {
          message: data.message || "Registration failed. Please try again."
        });
        return;
      }
      
      console.log("Registration successful:", data);
      
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        console.error("Login after registration failed:", loginData.message);
      } else {
        const user = loginData.user;
        if (typeof window !== "undefined") {
          localStorage.setItem("userFirstName", user.firstName);
          localStorage.setItem("userLastName", user.lastName);
          localStorage.setItem("userEmail", user.email);
          localStorage.setItem("userId", user.id.toString());
          localStorage.setItem("userType", user.type);
          localStorage.setItem("userMajor", user.major);
          localStorage.setItem("userLevel", user.skillLevel);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("signupFirstName");
        localStorage.removeItem("signupLastName");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("signupPassword");
      }
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Error during registration:", error);
      form.setError("root", {
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  if (!firstName || !lastName || !email || !password) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  const filteredSkills = allSkills.filter(skill =>
    skill.label.toLowerCase().includes(skillSearchTerm.toLowerCase())
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Welcome, {firstName}! Tell us more.</CardTitle>
        </CardHeader>
        <CardContent>
          {form.formState.errors.root && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded">
              {form.formState.errors.root.message}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your major" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {majors.map((major) => (
                          <SelectItem key={major} value={major}>
                            {major}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skillLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Skill Level</FormLabel>
                    <FormDescription>
                      How would you rate your overall technical skill level?
                    </FormDescription>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your skill level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {skillLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base">Skills to Learn</FormLabel>
                      <FormDescription>
                        Select the skills you are interested in learning.
                      </FormDescription>
                    </div>
                    <Input
                      placeholder="Search skills..."
                      value={skillSearchTerm}
                      onChange={(e) => setSkillSearchTerm(e.target.value)}
                      disabled={isLoadingSkills}
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {isLoadingSkills ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          ))}
                        </div>
                      ) : fetchSkillsError ? (
                        <p className="text-sm text-red-600 col-span-full text-center py-4">Error loading skills: {fetchSkillsError}</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                          {filteredSkills.length > 0 ? (
                            filteredSkills.map((skill) => (
                              <FormField
                                key={skill.id}
                                control={form.control}
                                name="skills"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={skill.id}
                                      className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 justify-start hover:bg-accent"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(skill.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), skill.id])
                                              : field.onChange(
                                                  (field.value || [])?.filter(
                                                    (value: string) => value !== skill.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                        {skill.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground col-span-full text-center py-4">No skills found matching your search.</p>
                          )}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoadingSkills || !allSkills.length}>Complete Sign Up</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 