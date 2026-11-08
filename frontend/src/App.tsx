import * as React from 'react';
import { Providers } from './app/providers';
import { AppRouter } from './app/router';

export default function App() {
  return (
    <Providers>
      <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
        <AppRouter />
      </div>
    </Providers>
  );
}
