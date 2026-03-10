import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Meeting = {
  id: number;
  topic: string;
  start_time: string;
  duration: number;
  join_url?: string;
  agenda?: string;
};

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ topic: "", agenda: "", duration: 60 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTopic, setEditTopic] = useState("");

  const loadMeetings = () => {
    setLoading(true);
    fetch("/api/zoom/meetings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load meetings");
        return r.json();
      })
      .then(setMeetings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const start_time = new Date().toISOString();
    fetch("/api/zoom/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: form.topic || "Meeting",
        agenda: form.agenda,
        duration: form.duration,
        start_time,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || "Create failed")));
        return r.json();
      })
      .then(() => {
        setCreateOpen(false);
        setForm({ topic: "", agenda: "", duration: 60 });
        loadMeetings();
      })
      .catch((e) => setError(e.message));
  };

  const handleUpdate = (meetingId: number) => {
    if (!editTopic.trim()) return;
    fetch(`/api/zoom/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: editTopic }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || "Update failed")));
      })
      .then(() => {
        setEditingId(null);
        setEditTopic("");
        loadMeetings();
      })
      .catch((e) => setError(e.message));
  };

  const handleDelete = (meetingId: number) => {
    if (!confirm("Delete this meeting?")) return;
    fetch(`/api/zoom/meetings/${meetingId}`, { method: "DELETE" })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || "Delete failed")));
      })
      .then(loadMeetings)
      .catch((e) => setError(e.message));
  };

  if (loading && meetings.length === 0) return <div className="card">Loading meetings…</div>;
  if (error) {
    return (
      <div className="card">
        <p style={{ color: "var(--error, #c00)" }}>{error}</p>
        <Link to="/">Back to portal</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Zoom Meetings</h1>
      <Link to="/" style={{ display: "inline-block", marginBottom: "1rem" }}>
        ← Back to portal
      </Link>

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        style={{ marginBottom: "1rem" }}
      >
        Create meeting
      </button>

      {createOpen && (
        <form onSubmit={handleCreate} style={{ marginBottom: "1rem", textAlign: "left" }}>
          <div>
            <label>Topic</label>
            <input
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="Meeting topic"
              style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
            />
          </div>
          <div>
            <label>Agenda</label>
            <input
              value={form.agenda}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
              placeholder="Agenda"
              style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
            />
          </div>
          <div>
            <label>Duration (min)</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) || 60 }))}
              style={{ marginLeft: "0.5rem", width: "4rem", padding: "0.25rem" }}
            />
          </div>
          <button type="submit">Create</button>
          <button type="button" onClick={() => setCreateOpen(false)}>
            Cancel
          </button>
        </form>
      )}

      <ul style={{ listStyle: "none", padding: 0, textAlign: "left" }}>
        {meetings.map((m) => (
          <li
            key={m.id}
            style={{
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            {editingId === m.id ? (
              <>
                <input
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  placeholder="Topic"
                  style={{ padding: "0.25rem", marginRight: "0.5rem" }}
                />
                <button type="button" onClick={() => handleUpdate(m.id)}>
                  Save
                </button>
                <button type="button" onClick={() => { setEditingId(null); setEditTopic(""); }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <strong>{m.topic}</strong>
                <span style={{ marginLeft: "0.5rem", color: "#888" }}>
                  {m.duration} min · {new Date(m.start_time).toLocaleString()}
                </span>
                {m.join_url && (
                  <a href={m.join_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "0.5rem" }}>
                    Join
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(m.id);
                    setEditTopic(m.topic);
                  }}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(m.id)} style={{ marginLeft: "0.25rem" }}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {meetings.length === 0 && !createOpen && <p>No scheduled meetings.</p>}
    </div>
  );
}
