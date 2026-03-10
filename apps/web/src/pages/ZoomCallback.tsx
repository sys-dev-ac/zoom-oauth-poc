import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ZoomCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your Zoom account…");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setMessage("No authorization code received.");
      return;
    }

    fetch("/api/connectZoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Could not connect with Zoom");
        return r.json();
      })
      .then(() => {
        setStatus("success");
        setMessage("Zoom connected successfully!");
        setTimeout(() => navigate("/"), 2000);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not connect with Zoom. Please try again.");
      });
  }, [searchParams, navigate]);

  return (
    <div className="card" style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>
        {status === "processing" && "Processing…"}
        {status === "success" && "Success"}
        {status === "error" && "Error"}
      </h2>
      <p>{message}</p>
      {status === "success" && <p>Redirecting to portal…</p>}
      {status === "error" && (
        <a href="/" style={{ marginTop: "1rem", display: "inline-block" }}>
          Back to portal
        </a>
      )}
    </div>
  );
}
