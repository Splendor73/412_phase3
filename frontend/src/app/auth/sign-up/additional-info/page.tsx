"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const majors = [
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

const availableSkills = [
  { id: "nextjs", label: "Next.js" },
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "docker", label: "Docker" },
  { id: "kubernetes", label: "Kubernetes" },
  { id: "aws", label: "AWS" },
  { id: "gcp", label: "GCP" },
  { id: "sql", label: "SQL" },
  { id: "mongodb", label: "MongoDB" },
  { id: "tailwind", label: "Tailwind CSS" },
];

const formSchema = z.object({
  major: z.enum(majors, { required_error: "Major is required." }),
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
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      major: undefined,
      skills: [],
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firstName || !lastName || !email || !password) {
        console.error("Required sign-up data missing from state");
        router.push("/auth/sign-up");
        return;
    }

    const signupData = {
      firstName,
      lastName,
      email,
      password,
      major: values.major,
      skills: values.skills,
    };

    console.log("Completing sign up with:", signupData);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (typeof window !== "undefined") {
        // Store the first name for the dashboard
        if(firstName) localStorage.setItem("userFirstName", firstName);
        
        // Clear temporary signup data
        localStorage.removeItem("signupFirstName");
        localStorage.removeItem("signupLastName");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("signupPassword");
    }
    router.push("/dashboard");
  }

  if (!firstName || !lastName || !email || !password) {
    return <div>Loading...</div>;
  }

  const filteredSkills = availableSkills.filter(skill =>
    skill.label.toLowerCase().includes(skillSearchTerm.toLowerCase())
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Welcome, {firstName}! Tell us more.</CardTitle>
        </CardHeader>
        <CardContent>
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
                      className="mb-4"
                    />

                    <div className="max-h-[180px] overflow-y-auto border rounded-md p-2 pr-1 space-y-0">
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
                                                  (value) => value !== skill.id
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
                          <p className="text-sm text-muted-foreground col-span-full text-center py-4">No skills found.</p>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">Complete Sign Up</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 