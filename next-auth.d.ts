// next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      integrator: string;
      first_name: string;
      last_name: string;
    };
  }

  interface User {
    id: string;
    email: string;
    role: string;
    integrator: string;
    first_name: string;
    last_name: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: string;
    integrator: string;
    first_name: string;
    last_name: string;
  }
}