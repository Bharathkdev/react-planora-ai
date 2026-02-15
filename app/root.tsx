import { useEffect, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { getCurrentUser, signIn as puterSignIn, signOut as puterSignOut } from "lib/puter.action";

// Preload fonts for better performance & layout stability
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Root HTML shell used by React Router
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {/* Restores scroll position between navigations */}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Default unauthenticated state
const DEFAULT_AUTH_STATE: AuthState = {
  isSignedIn: false,
  userName: null,
  userId: null,
};

export default function App() {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  /**
   * Sync auth state with Puter session
   * Used:
   * - on app load
   * - after login
   * - after logout
   *
   * Centralized so UI stays consistent across pages
   */
  const refreshAuth = async (): Promise<boolean> => {
    try {
      const user = await getCurrentUser();

      setAuthState({
        isSignedIn: !!user,
        userName: user?.username || null,
        userId: user?.uuid || null,
      });

      return !!user;
    } catch (error) {
      console.error("Failed to refresh auth state:", error);
      setAuthState(DEFAULT_AUTH_STATE);
      return false;
    }
  };

  // Initialize auth state on first app mount
  useEffect(() => {
    refreshAuth();
  }, []);

  // Wrapper to ensure UI updates after Puter login
  const signIn = async (): Promise<boolean> => {
    await puterSignIn();
    return await refreshAuth();
  };

  // Wrapper to ensure UI updates after logout
  const signOut = async (): Promise<boolean> => {
    puterSignOut();
    return await refreshAuth();
  };

  return (
    <main className="min-h-screen bg-background text-foreground relative z-10">
      {/* Provide auth context to all routes */}
      <Outlet 
        context = {{ ...authState, refreshAuth, signIn, signOut }}
      />
    </main>
  )
}

/**
 * Global route error boundary
 * Handles:
 * - 404 pages
 * - runtime errors
 * - dev stack traces
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    // Show stack only in development
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
