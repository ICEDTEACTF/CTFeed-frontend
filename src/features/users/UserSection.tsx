import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { User } from "../../api/types";

export default function UserSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await apiRequest<User[]>(API_ENDPOINTS.users.list);
      if (result.ok && result.data) {
        setUsers(result.data);
        setSelected(result.data[0] ?? null);
        setNotice("");
      } else {
        setUsers([]);
        setSelected(null);
        setNotice(result.error ?? "Failed to load users");
      }
    };
    load();
  }, []);

  return (
    <section className="section">
      <div className="section-header">
        <h2>Users</h2>
      </div>
      {notice && <p className="notice">{notice}</p>}
      <div className="grid">
        <div className="list">
          {users.length === 0 && <p className="muted">No users found.</p>}
          {users.map((user) => (
            <button
              key={user.discord_id}
              type="button"
              className={selected?.discord_id === user.discord_id ? "list-item active" : "list-item"}
              onClick={() => setSelected(user)}
            >
              <div className="list-title">
                {user.discord?.display_name ?? user.discord?.name ?? `User ${user.discord_id}`}
              </div>
              <div className="list-meta">
                <span>{user.status}</span>
                <span>{(user.events ?? []).length} events</span>
              </div>
            </button>
          ))}
        </div>
        <div className="detail">
          {selected ? (
            <div className="detail-card">
              <h3>{selected.discord?.display_name ?? selected.discord?.name ?? "User"}</h3>
              <p className="muted">Discord ID: {selected.discord_id}</p>
              <p>Status: {selected.status}</p>
              <p>Skills: {(selected.skills ?? []).join(", ") || "N/A"}</p>
              <p>Rhythm Games: {(selected.rhythm_games ?? []).join(", ") || "N/A"}</p>
              <div className="detail-sub">
                <span className="label">Events</span>
                <ul>
                  {(selected.events ?? []).map((event) => (
                    <li key={event.id}>{event.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted">Select a user to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
