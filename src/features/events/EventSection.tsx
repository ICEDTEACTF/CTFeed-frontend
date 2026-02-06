import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { EventItem, GeneralResponse } from "../../api/types";
import { formatTimestampToLocal } from "../../utils/date";

type EventType = "ctftime" | "custom";

export default function EventSection() {
  const [eventType, setEventType] = useState<EventType>("ctftime");
  const [archived, setArchived] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [relinkId, setRelinkId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const query = new URLSearchParams({
        type: eventType,
        archived: archived ? "true" : "false",
      }).toString();
      const result = await apiRequest<EventItem[]>(`${API_ENDPOINTS.events.list}?${query}`);
      if (result.ok && result.data) {
        setEvents(result.data);
        setSelected(result.data[0] ?? null);
        setNotice("");
      } else {
        setEvents([]);
        setSelected(null);
        setNotice(result.error ?? "Failed to load events");
      }
      setLoading(false);
    };
    load();
  }, [eventType, archived]);

  const handleCreateCustom = async () => {
    const title = window.prompt("Enter custom event title");
    if (!title) return;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.createCustom, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    if (!result.ok) {
      setNotice(result.error ?? "Failed to create event");
      return;
    }
    setNotice("Custom event created");
    setEventType("custom");
  };

  const handleJoin = async () => {
    if (!selected) return;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.join(selected.id), {
      method: "PATCH",
    });
    setNotice(result.ok ? "Join request sent" : result.error ?? "Failed to join event");
  };

  const handleArchive = async () => {
    if (!selected) return;
    const confirmed = window.confirm("Archive this event? PM permission required.");
    if (!confirmed) return;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.archive(selected.id), {
      method: "PATCH",
    });
    setNotice(result.ok ? "Archive request sent" : result.error ?? "Failed to archive event");
  };

  const handleRelink = async () => {
    if (!selected) return;
    const channelId = Number(relinkId);
    if (!Number.isFinite(channelId) || channelId <= 0) {
      setNotice("Please provide a valid channel ID");
      return;
    }
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.relink(selected.id), {
      method: "PATCH",
      body: JSON.stringify({ channel_id: channelId }),
    });
    setNotice(result.ok ? "Relink request sent" : result.error ?? "Failed to relink event");
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2>Events</h2>
        <div className="filters">
          <div className="segmented">
            <button
              type="button"
              className={eventType === "ctftime" ? "active" : ""}
              onClick={() => setEventType("ctftime")}
            >
              CTFTime
            </button>
            <button
              type="button"
              className={eventType === "custom" ? "active" : ""}
              onClick={() => setEventType("custom")}
            >
              Custom
            </button>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={archived}
              onChange={(event) => setArchived(event.target.checked)}
            />
            <span>Show archived</span>
          </label>
          {eventType === "custom" && (
            <button type="button" className="secondary" onClick={handleCreateCustom}>
              New Custom Event
            </button>
          )}
        </div>
      </div>
      {notice && <p className="notice">{notice}</p>}
      <div className="grid">
        <div className="list">
          {loading && <p className="muted">Loading...</p>}
          {!loading && events.length === 0 && <p className="muted">No events found.</p>}
          {!loading &&
            events.map((event) => (
              <button
                key={event.id}
                type="button"
                className={selected?.id === event.id ? "list-item active" : "list-item"}
                onClick={() => setSelected(event)}
              >
                <div className="list-title">{event.title}</div>
                <div className="list-meta">
                  <span>{event.type}</span>
                  {event.archived && <span className="badge">Archived</span>}
                </div>
              </button>
            ))}
        </div>
        <div className="detail">
          {selected ? (
            <div className="detail-card">
              <h3>{selected.title}</h3>
              <div className="detail-grid">
                <div>
                  <span className="label">Event ID</span>
                  <span>{selected.event_id ?? "N/A"}</span>
                </div>
                <div>
                  <span className="label">Database ID</span>
                  <span>{selected.id}</span>
                </div>
                <div>
                  <span className="label">Start</span>
                  <span>{formatTimestampToLocal(selected.start)}</span>
                </div>
                <div>
                  <span className="label">Finish</span>
                  <span>{formatTimestampToLocal(selected.finish)}</span>
                </div>
                <div>
                  <span className="label">Channel</span>
                  <span>{selected.channel?.name ?? "N/A"}</span>
                </div>
                <div>
                  <span className="label">Participants</span>
                  <span>{selected.users?.length ?? 0}</span>
                </div>
              </div>
              {selected.channel?.jump_url && (
                <a className="link" href={selected.channel.jump_url} target="_blank" rel="noreferrer">
                  Open Discord Channel
                </a>
              )}
              <div className="actions">
                <button type="button" className="primary" onClick={handleJoin}>
                  Join Channel
                </button>
                <button type="button" className="secondary" onClick={handleArchive}>
                  Archive (PM)
                </button>
                <div className="inline">
                  <input
                    type="text"
                    value={relinkId}
                    placeholder="Channel ID"
                    onChange={(event) => setRelinkId(event.target.value)}
                  />
                  <button type="button" className="secondary" onClick={handleRelink}>
                    Relink (PM)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Select an event to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
