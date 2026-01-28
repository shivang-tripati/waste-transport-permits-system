import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { UserRole } from '@prisma/client';
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

  const decoded = verifyAccessToken(token);

  if (!decoded || decoded.data.role !== UserRole.ADMIN) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
