"use client";
export default function ErrorPage({ reset }) { return <div className="admin-page-loading"><h1>We couldn’t open the workspace.</h1><p>Please check your connection and try again.</p><button className="admin-button primary" onClick={reset}>Try again</button></div>; }
