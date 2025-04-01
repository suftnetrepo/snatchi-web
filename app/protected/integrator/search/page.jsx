import { Suspense } from 'react';
import Search from './search';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Search />
    </Suspense>
  );
}