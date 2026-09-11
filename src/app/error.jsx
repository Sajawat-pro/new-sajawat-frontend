"use client";
export default function ErrorPage({ reset }) { return <div className="mx-auto max-w-xl px-6 py-28 text-center"><h1 className="mb-4 text-3xl">We couldn’t load this page.</h1><p className="mb-7 text-sm text-[#787c70]">Please check your connection and try again.</p><button onClick={reset} className="rounded bg-[#314b38] px-7 py-3 text-white">Try again</button></div>; }
