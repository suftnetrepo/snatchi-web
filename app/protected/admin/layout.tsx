import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth';
import AdminShell from './AdminShell';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?returnUrl=/protected/admin/dashboard');
  if (session.user?.role !== 'admin') redirect('/login?error=admin_access_required');

  return <AdminShell>{children}</AdminShell>;
}
