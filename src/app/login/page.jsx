"use client";

import Image from "@/components/MediaImage";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const requestedPath = searchParams.get("next");

  const destination =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\")
      ? requestedPath
      : "/";

  const completeLogin = async (idToken) => {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to complete login.");
    }

    await signOut(firebaseAuth);

    localStorage.setItem("userLogin", "true");

    router.replace(destination);
    router.refresh();
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await setPersistence(firebaseAuth, inMemoryPersistence);

      const result = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      const idToken = await result.user.getIdToken(true);

      await completeLogin(idToken);
    } catch (loginError) {
      console.error(loginError);

      if (
        loginError.code === "auth/invalid-credential" ||
        loginError.code === "auth/wrong-password" ||
        loginError.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else {
        setError(
          loginError.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      await setPersistence(firebaseAuth, inMemoryPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken(true);

      await completeLogin(idToken);
    } catch (loginError) {
      console.error(loginError);

      if (loginError.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (loginError.code === "auth/popup-blocked") {
        setError("Please allow pop-ups and try again.");
      } else {
        setError(
          loginError.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[calc(100vh-108px)] lg:grid-cols-2">
      {/* Login image */}
      <div className="relative hidden overflow-hidden bg-[#ded9cf] lg:block">
        <Image
          src="/images/login/login-cover.jpg"
          alt="Sajawat wall décor in a modern Indian home"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-x-0 bottom-0 z-10 p-12 text-white">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/80">
            Welcome to Sajawat
          </p>

          <h1 className="max-w-lg text-4xl font-medium leading-tight">
            Thoughtful décor for walls that deserve more.
          </h1>
        </div>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center px-6 py-20 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-12 inline-block text-xl font-semibold tracking-[0.22em]"
          >
            SAJAWAT
          </Link>

          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#6b6a65]">
            Your Sajawat Account
          </p>

          <h2 className="mb-3 text-3xl font-medium">Welcome back</h2>

          <p className="mb-9 text-sm leading-relaxed text-[#6b6a65]">
            Sign in securely to continue checkout, manage your orders and
            save your favourite décor.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-[#3f3e3a]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#a9a7a1] focus:border-[#2b2b28]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-[#3f3e3a]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#a9a7a1] focus:border-[#2b2b28]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center bg-[#2b2b28] px-5 py-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing you in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 text-xs text-[#8a8984]">
            <span className="h-px flex-1 bg-black/10" />
            or
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative mt-6 flex w-full items-center justify-center gap-3 overflow-hidden border border-black/20 bg-white px-5 py-4 text-sm font-medium transition-all duration-300 hover:border-[#2b2b28] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 origin-top scale-y-0 bg-[#2b2b28] transition-transform duration-500 group-hover:scale-y-100" />

            {loading ? (
              <span className="relative z-10 h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-[#2b2b28] group-hover:border-white/30 group-hover:border-t-white" />
            ) : (
              <svg
                className="relative z-10"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.35 12.18c0-.64-.06-1.25-.17-1.84H12v3.48h5.25a4.49 4.49 0 0 1-1.95 2.94v2.26h3.16c1.85-1.7 2.89-4.21 2.89-6.84Z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.7c2.64 0 4.86-.87 6.48-2.38l-3.16-2.46c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.49-4.03H3.25v2.54A9.79 9.79 0 0 0 12 21.7Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.51 13.77A5.9 5.9 0 0 1 6.2 12c0-.62.11-1.22.31-1.77V7.69H3.25A9.8 9.8 0 0 0 2.2 12c0 1.58.38 3.08 1.05 4.31l3.26-2.54Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.2c1.44 0 2.73.5 3.75 1.47l2.81-2.81A9.43 9.43 0 0 0 12 2.3a9.79 9.79 0 0 0-8.75 5.39l3.26 2.54C7.29 7.92 9.45 6.2 12 6.2Z"
                />
              </svg>
            )}

            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              {loading ? "Signing you in..." : "Continue with Google"}
            </span>
          </button>

          <p className="mt-7 text-center text-xs leading-relaxed text-[#6b6a65]">
            By continuing, you agree to Sajawat&apos;s{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}