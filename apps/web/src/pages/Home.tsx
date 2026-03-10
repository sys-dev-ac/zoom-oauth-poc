import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [connection, setConnection] = useState<{ email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/zoom/auth-url")
      .then((r) => r.json())
      .then((data) => setAuthUrl(data.url))
      .catch(() => setError("Could not load Zoom auth URL"));
  }, []);

  useEffect(() => {
    fetch("/api/zoom/connection")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setConnection)
      .catch(() => setConnection(null));
  }, []);

  return (
    <div className="card">
      <h1>Portal</h1>
      {error && <p style={{ color: "var(--error, #c00)" }}>{error}</p>}
      {connection ? (
        <p>
          Connected as <strong>{connection.email}</strong>.{" "}
          <Link to="/meetings">Manage meetings</Link>
        </p>
      ) : authUrl ? (
        <a
          href={authUrl}
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.6em 1.2em",
            background: "#2d8cff",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Connect Zoom
        </a>
      ) : (
        <p>Loading…</p>
      )}
    </div>
  );
}
