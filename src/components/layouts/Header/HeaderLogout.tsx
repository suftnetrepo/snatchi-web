'use client';

import { useRouter } from 'next/navigation';
import { useSecure } from '../../../../hooks/useSecure';

export default function HeaderLogout({ children }: { children: React.ReactNode }) {
  const { handleLogout } = useSecure();
  const router = useRouter();
  const logout = async () => {
    handleLogout().then((result) => {
      result && router.push('/');
    });
  };

  return (
    <div onClick={logout} onKeyDown={logout} role="button" tabIndex={0}>
      {children}
    </div>
  );
}
