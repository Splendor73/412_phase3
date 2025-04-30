import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/auth/sign-in');
  // Note: The redirect function should be called before any JSX is returned.
  // If you needed to return something (e.g., a loading state) before redirecting,
  // you'd use useRouter().push() inside a useEffect hook instead.
  return null; // Or a loading component, though redirect should happen server-side
}
