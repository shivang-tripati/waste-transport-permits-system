import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/login');
  }

  return <>{children}</>;
}
