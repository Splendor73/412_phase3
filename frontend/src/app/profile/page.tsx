"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserDetails, updateUserDetails, UserProfile, skillLevels, majors } from '@/lib/api';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { withAuth } from '@/components/auth/auth-provider';

function ProfilePage() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState<Partial<UserProfile>>({});

    useEffect(() => {
        const fetchProfile = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setError('User not logged in');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const profileData = await getUserDetails(parseInt(userId));
                setUserProfile(profileData);
                setFormData({
                    first_name: profileData.first_name,
                    last_name: profileData.last_name,
                    email: profileData.email,
                    level: profileData.level || 'none',
                    major: profileData.major || 'none',
                });
                setError(null);
            } catch (err: any) {
                console.error("Error fetching profile:", err);
                setError(err.message || 'Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof UserProfile) => (value: string) => {
        setFormData(prev => ({ ...prev, [name]: value === 'none' ? null : value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        if (!formData.first_name || !formData.last_name || !formData.email) {
            toast.error("Validation Error", {
                description: "First Name, Last Name, and Email cannot be empty.",
            });
            return;
        }

        setLoading(true);
        try {
            const changes: Partial<UserProfile> = {};

            const updatableFields: (keyof UserProfile)[] = ['first_name', 'last_name', 'email', 'level', 'major'];

            updatableFields.forEach(field => {
                if (formData[field] !== userProfile[field] && !(formData[field] === '' && userProfile[field] == null)) {
                    changes[field] = formData[field] as any;
                }
            });

            if (Object.keys(changes).length === 0) {
                toast("No Changes", { description: "No information was modified." });
                setIsEditing(false);
                setLoading(false);
                return;
            }

            const result = await updateUserDetails(userProfile.user_id, changes);

            setUserProfile(result.user);
            setFormData({
                first_name: result.user.first_name,
                last_name: result.user.last_name,
                email: result.user.email,
                level: result.user.level || 'none',
                major: result.user.major || 'none',
             });

             localStorage.setItem('userFirstName', result.user.first_name);
             if(result.user.level) localStorage.setItem('userLevel', result.user.level); else localStorage.removeItem('userLevel');

            toast.success("Profile Updated", {
                description: "Your profile information has been saved.",
            });
            setIsEditing(false);

        } catch (err: any) {
            console.error("Error updating profile:", err);
            toast.error("Update Failed", {
                description: err.message || "Could not update profile. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (userProfile) {
             setFormData({
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                email: userProfile.email,
                level: userProfile.level || 'none',
                major: userProfile.major || 'none',
             });
        }
        setIsEditing(false);
    };

    if (loading && !userProfile) {
        return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
    }

    if (error) {
        return <div className="flex flex-col justify-center items-center min-h-screen text-red-500">
            <p>Error: {error}</p>
            <Link href="/dashboard"><Button variant="link">Go back to Dashboard</Button></Link>
        </div>;
    }

    if (!userProfile) {
        return <div className="flex justify-center items-center min-h-screen">No profile data found.</div>;
    }

    const displayValue = (value: string | null | undefined) => value || <span className='text-muted-foreground italic'>Not Set</span>;


    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl">
            <Toaster richColors closeButton />
            <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>   
            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>View and update your personal information.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSaveChanges}>
                    <CardContent className="space-y-6">
                        {!isEditing && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <Label className="text-right font-semibold">First Name:</Label>
                                    <span className="col-span-2">{userProfile.first_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <Label className="text-right font-semibold">Last Name:</Label>
                                    <span className="col-span-2">{userProfile.last_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <Label className="text-right font-semibold">Email:</Label>
                                    <span className="col-span-2">{userProfile.email}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <Label className="text-right font-semibold">Level:</Label>
                                    <span className="col-span-2">{displayValue(userProfile.level)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <Label className="text-right font-semibold">Major:</Label>
                                     <span className="col-span-2">{displayValue(userProfile.major)}</span>
                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                     <Label htmlFor="first_name" className="text-right">First Name</Label>
                                     <Input id="first_name" name="first_name" value={formData.first_name || ''} onChange={handleInputChange} className="col-span-2" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                     <Label htmlFor="last_name" className="text-right">Last Name</Label>
                                     <Input id="last_name" name="last_name" value={formData.last_name || ''} onChange={handleInputChange} className="col-span-2" />
                                </div>
                                 <div className="grid grid-cols-3 gap-4 items-center">
                                     <Label htmlFor="email" className="text-right">Email</Label>
                                     <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} className="col-span-2" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                     <Label htmlFor="level" className="text-right">Level</Label>
                                     <Select name="level" value={formData.level || ''} onValueChange={handleSelectChange('level')}>
                                        <SelectTrigger className="col-span-2">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not Set</SelectItem>
                                            {skillLevels.map(level => (
                                                <SelectItem key={level} value={level}>{level}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid grid-cols-3 gap-4 items-center">
                                     <Label htmlFor="major" className="text-right">Major</Label>
                                      <Select name="major" value={formData.major || ''} onValueChange={handleSelectChange('major')}>
                                        <SelectTrigger className="col-span-2">
                                            <SelectValue placeholder="Select major" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="none">Not Set</SelectItem>
                                             {majors.map(major => (
                                                <SelectItem key={major} value={major}>{major}</SelectItem>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 mt-4">
                        {!isEditing ? (
                            <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={loading}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default withAuth(ProfilePage); 