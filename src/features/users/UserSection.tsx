import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { User } from "../../api/types";

type UserSectionProps = {
  selectedUserId: string | null;
  onSelectUser: (id: string) => void;
  onOpenEvent: (id: string) => void;
};

const formatRoleLabel = (role: "Administrator" | "pm" | "member") => {
  if (role === "Administrator") return "Administrator";
  if (role === "pm") return "PM";
  return "Member";
};

const getRoleBadgeClassName = (role: "Administrator" | "pm" | "member") => {
  if (role === "Administrator") return "role-badge role-admin";
  if (role === "pm") return "role-badge role-pm";
  return "role-badge role-member";
};

export default function UserSection({ selectedUserId, onSelectUser, onOpenEvent }: UserSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await apiRequest<User[]>(API_ENDPOINTS.users.list);
      if (result.ok && result.data) {
        setUsers(result.data);
        const nextSelected =
          selectedUserId
            ? (result.data.find((user) => user.discord_id === selectedUserId) ?? null)
            : (result.data[0] ?? null);
        setSelected(nextSelected);
        if (nextSelected && nextSelected.discord_id !== selectedUserId) {
          onSelectUser(nextSelected.discord_id);
        }
        setNotice("");
      } else {
        setUsers([]);
        setSelected(null);
        setNotice(result.error ?? "Failed to load users");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    const loadById = async () => {
      const result = await apiRequest<User>(API_ENDPOINTS.users.detail(selectedUserId));
      const user = result.ok && result.data ? result.data : null;
      if (!user) return;
      setSelected(user);
      setUsers((prev) =>
        prev.some((item) => item.discord_id === user.discord_id)
          ? prev.map((item) => (item.discord_id === user.discord_id ? user : item))
          : prev
      );
    };
    loadById();
  }, [selectedUserId]);

  return (
    <section className="section">
      <div className="section-header">
        <h2>Users</h2>
      </div>
      {notice && <p className="notice">{notice}</p>}
      <div className="grid">
        <div className="list scrollable">
          {users.length === 0 && <p className="muted">No users found.</p>}
          {users.map((user) => (
            <button
              key={user.discord_id}
              type="button"
              className={selected?.discord_id === user.discord_id ? "list-item active" : "list-item"}
              onClick={() => {
                setSelected(user);
                onSelectUser(user.discord_id);
              }}
            >
              <div className="list-title">
                {user.discord?.display_name ?? user.discord?.name ?? `User ${user.discord_id}`}
              </div>
              <div className="list-meta">
                <span>{user.status}</span>
                <span>{(user.events ?? []).length} events</span>
              </div>
              <div className="role-badges">
                {(user.user_role ?? []).length === 0 && (
                  <span className="role-badge role-none">No role</span>
                )}
                {(user.user_role ?? []).map((role) => (
                  <span key={role} className={getRoleBadgeClassName(role)}>
                    {formatRoleLabel(role)}
                  </span>
                ))}
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
              <div className="detail-sub role-block">
                <span className="label">Role</span>
                <div className="role-badges">
                  {(selected.user_role ?? []).length === 0 && (
                    <span className="role-badge role-none">No role</span>
                  )}
                  {(selected.user_role ?? []).map((role) => (
                    <span key={role} className={getRoleBadgeClassName(role)}>
                      {formatRoleLabel(role)}
                    </span>
                  ))}
                </div>
              </div>
              <p>Skills: {(selected.skills ?? []).join(", ") || "N/A"}</p>
              <p>Rhythm Games: {(selected.rhythm_games ?? []).join(", ") || "N/A"}</p>
              <div className="detail-sub detail-sub-spacious">
                <span className="label">Joined Events</span>
                {(selected.events ?? []).length === 0 && (
                  <p className="muted">No joined events.</p>
                )}
                <div className="list scrollable detail-list">
                  {(selected.events ?? []).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="list-item detail-list-item"
                      onClick={() => onOpenEvent(event.id)}
                    >
                      <div className="list-title">{event.title}</div>
                      <div className="list-meta">
                        <span>{event.type}</span>
                        <span>DB ID: {event.id}</span>
                      </div>
                    </button>
                  ))}
                </div>
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
