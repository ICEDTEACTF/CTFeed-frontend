import { useEffect, useState, type UIEvent } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { DiscordChannel, EventItem, GeneralResponse, UserSimple } from "../../api/types";
import { formatTimestampToLocal } from "../../utils/date";
import Modal from "../../components/Modal";

type EventType = "ctftime" | "custom";

type EventSectionProps = {
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onOpenUser: (id: string) => void;
  userRoles: UserSimple["user_role"];
};

type EventCursor = {
  beforeId: string | null;
  finishBefore: string | null;
};

const PAGE_SIZE = 20;

export default function EventSection({ selectedEventId, onSelectEvent, onOpenUser, userRoles }: EventSectionProps) {
  const [eventType, setEventType] = useState<EventType>("ctftime");
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cursor, setCursor] = useState<EventCursor>({ beforeId: null, finishBefore: null });
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [guildChannels, setGuildChannels] = useState<DiscordChannel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<"alert" | "confirm" | "input" | "select">("alert");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalInputLabel, setModalInputLabel] = useState("");
  const [modalInputPlaceholder, setModalInputPlaceholder] = useState("");
  const [modalInputDefault, setModalInputDefault] = useState("");
  const [modalSelectOptions, setModalSelectOptions] = useState<{ label: string; value: string }[]>([]);
  const [modalConfirmLabel, setModalConfirmLabel] = useState("OK");
  const [modalAction, setModalAction] = useState<(value?: string) => void>(() => () => {});
  const canArchive = userRoles.includes("pm");
  const canRelink = userRoles.includes("Administrator");

  const getSafeChannelLink = (jumpUrl?: string | null) => {
    if (!jumpUrl) return null;
    if (jumpUrl.startsWith("https://discord.com/channels/")) {
      return jumpUrl;
    }
    return null;
  };

  const appendEvents = (oldEvents: EventItem[], newEvents: EventItem[]) => {
    const oldEventIds = new Set(oldEvents.map((event) => event.id));
    const filtered = newEvents.filter((event) => !oldEventIds.has(event.id));
    return [...oldEvents, ...filtered];
  };

  const formatErrorDetails = (result: { errorData?: unknown | null }) => {
    if (!result.errorData) return "";
    try {
      return JSON.stringify(result.errorData, null, 2);
    } catch {
      return String(result.errorData);
    }
  };

  const openAlert = (title: string, message: string, details?: string) => {
    setModalTitle(title);
    setModalMessage(details ? `${message}\n${details}` : message);
    setModalVariant("alert");
    setModalConfirmLabel("OK");
    setModalAction(() => () => setModalOpen(false));
    setModalOpen(true);
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant("confirm");
    setModalConfirmLabel("Confirm");
    setModalAction(() => () => onConfirm());
    setModalOpen(true);
  };

  const openInputModal = (
    title: string,
    message: string,
    inputLabel: string,
    inputPlaceholder: string,
    onConfirm: (value: string) => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalInputLabel(inputLabel);
    setModalInputPlaceholder(inputPlaceholder);
    setModalInputDefault("");
    setModalVariant("input");
    setModalConfirmLabel("Confirm");
    setModalAction(() => (value?: string) => onConfirm(value ?? ""));
    setModalOpen(true);
  };

  const openSelectModal = (
    title: string,
    message: string,
    inputLabel: string,
    options: { label: string; value: string }[],
    defaultValue: string,
    onConfirm: (value: string) => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalInputLabel(inputLabel);
    setModalInputPlaceholder("");
    setModalInputDefault(defaultValue);
    setModalSelectOptions(options);
    setModalVariant("select");
    setModalConfirmLabel("Confirm");
    setModalAction(() => (value?: string) => onConfirm(value ?? ""));
    setModalOpen(true);
  };

  const buildEventListPath = (
    nextType: EventType,
    nextArchivedOnly: boolean,
    nextCursor: EventCursor
  ) => {
    const basePath =
      nextType === "ctftime" ? API_ENDPOINTS.events.listCtfTime : API_ENDPOINTS.events.listCustom;
    const query = new URLSearchParams({
      archived: nextArchivedOnly ? "true" : "false",
      limit: String(PAGE_SIZE),
    });
    if (nextType === "ctftime" && nextCursor.finishBefore && nextCursor.beforeId) {
      query.set("finish_before", nextCursor.finishBefore);
      query.set("before_id", nextCursor.beforeId);
    }
    if (nextType === "custom" && nextCursor.beforeId) {
      query.set("before_id", nextCursor.beforeId);
    }
    return `${basePath}?${query.toString()}`;
  };

  const fetchOnePage = async (
    nextType: EventType,
    nextArchivedOnly: boolean,
    nextCursor: EventCursor
  ) => {
    const result = await apiRequest<EventItem[]>(
      buildEventListPath(nextType, nextArchivedOnly, nextCursor)
    );
    if (result.ok && result.data) {
      return {
        ok: true as const,
        data: result.data,
      };
    }
    return {
      ok: false as const,
      error: result.error ?? "Failed to load events",
      details: formatErrorDetails(result),
    };
  };

  const calculateNextCursor = (nextType: EventType, loadedEvents: EventItem[]) => {
    if (loadedEvents.length === 0) {
      return { beforeId: null, finishBefore: null };
    }
    const lastEvent = loadedEvents[loadedEvents.length - 1];
    if (nextType === "ctftime") {
      return {
        beforeId: lastEvent.id,
        finishBefore: lastEvent.finish ?? null,
      };
    }
    return {
      beforeId: lastEvent.id,
      finishBefore: null,
    };
  };

  const loadFirstPage = async (nextType = eventType, nextArchivedOnly = archivedOnly) => {
    setLoadingInitial(true);
    const firstCursor: EventCursor = { beforeId: null, finishBefore: null };
    const page = await fetchOnePage(nextType, nextArchivedOnly, firstCursor);
    if (page.ok) {
      const nextEvents = page.data;
      setEvents(nextEvents);
      const nextSelected =
        selectedEventId
          ? (nextEvents.find((event) => event.id === selectedEventId) ?? null)
          : (nextEvents[0] ?? null);
      setSelected(nextSelected);
      if (nextSelected && nextSelected.id !== selectedEventId) {
        onSelectEvent(nextSelected.id);
      }
      setCursor(calculateNextCursor(nextType, nextEvents));
      setHasMore(nextEvents.length === PAGE_SIZE);
      setNotice("");
    } else {
      setEvents([]);
      setSelected(null);
      setCursor({ beforeId: null, finishBefore: null });
      setHasMore(false);
      setNotice(page.details ? `${page.error}\n${page.details}` : page.error);
    }
    setLoadingInitial(false);
  };

  const loadGuildChannels = async () => {
    const result = await apiRequest<DiscordChannel[]>(API_ENDPOINTS.guild.textChannels);
    if (!result.ok || !result.data) {
      setGuildChannels([]);
      return [];
    }
    setGuildChannels(result.data);
    return result.data;
  };

  const loadNextPage = async () => {
    if (!hasMore || loadingInitial || loadingMore) return;
    setLoadingMore(true);
    const page = await fetchOnePage(eventType, archivedOnly, cursor);
    if (page.ok) {
      let mergedEvents: EventItem[] = [];
      setEvents((prev) => {
        mergedEvents = appendEvents(prev, page.data);
        return mergedEvents;
      });
      setCursor(calculateNextCursor(eventType, mergedEvents));
      setHasMore(page.data.length === PAGE_SIZE);
      setNotice("");
    } else {
      setNotice(page.details ? `${page.error}\n${page.details}` : page.error);
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const refreshSelectedEvent = async (eventId: string) => {
    const detail = await apiRequest<EventItem>(API_ENDPOINTS.events.detail(eventId));
    const event = detail.ok && detail.data ? detail.data : null;
    if (!event) return;
    setSelected(event);
    setEvents((prev) =>
      prev.some((item) => item.id === event.id)
        ? prev.map((item) => (item.id === event.id ? { ...item, ...event } : item))
        : prev
    );
  };

  const handleEventListScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const remain = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remain <= 80) {
      loadNextPage();
    }
  };

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, archivedOnly]);

  useEffect(() => {
    loadGuildChannels();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    const loadById = async () => {
      const result = await apiRequest<EventItem>(API_ENDPOINTS.events.detail(selectedEventId));
      const event = result.ok && result.data ? result.data : null;
      if (!event) {
        return;
      }
      if (event.type !== eventType) {
        setEventType(event.type);
      }
      if (event.archived !== archivedOnly) {
        setArchivedOnly(event.archived);
      }
      setSelected(event);
      setEvents((prev) =>
        prev.some((item) => item.id === event.id)
          ? prev.map((item) => (item.id === event.id ? { ...item, ...event } : item))
          : prev
      );
    };
    loadById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const handleCreateCustom = async () => {
    openInputModal(
      "Create Custom Event",
      "Enter event title and confirm.",
      "Event Title",
      "Custom event title",
      async (value) => {
      if (!value.trim()) {
        openAlert("Invalid Input", "Please enter a title.");
        return;
      }
      const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.createCustom, {
        method: "POST",
        body: JSON.stringify({ title: value.trim() }),
      });
      if (!result.ok) {
        openAlert("Failed", result.error ?? "Failed to create event", formatErrorDetails(result));
        return;
      }
      openAlert("Success", "Custom event created");
      if (eventType === "custom") {
        await loadFirstPage("custom", archivedOnly);
      } else {
        setEventType("custom");
      }
    }
    );
  };

  const handleJoin = async () => {
    if (!selected) return;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.join(selected.id), {
      method: "PATCH",
    });
    openAlert(
      result.ok ? "Success" : "Failed",
      result.ok ? "Join request sent" : result.error ?? "Failed to join event",
      result.ok ? "" : formatErrorDetails(result)
    );
    if (result.ok) {
      await refreshSelectedEvent(selected.id);
    }
  };

  const handleArchive = async () => {
    if (!selected) return;
    openConfirm("Archive Event", "Archive this event?", async () => {
      const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.archive(selected.id), {
        method: "PATCH",
      });
      openAlert(
        result.ok ? "Success" : "Failed",
        result.ok ? "Archive request sent" : result.error ?? "Failed to archive event",
        result.ok ? "" : formatErrorDetails(result)
      );
      if (result.ok) {
        await refreshSelectedEvent(selected.id);
      }
    });
  };

  const handleRelink = async (channelIdValue: string) => {
    if (!selected) return;
    if (!channelIdValue) {
      openAlert("Invalid Input", "Please select a channel.");
      return;
    }
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.relink(selected.id), {
      method: "PATCH",
      body: JSON.stringify({ channel_id: channelIdValue }),
    });
    openAlert(
      result.ok ? "Success" : "Failed",
      result.ok ? "Relink request sent" : result.error ?? "Failed to relink event",
      result.ok ? "" : formatErrorDetails(result)
    );
    if (result.ok) {
      await refreshSelectedEvent(selected.id);
    }
  };

  const handleOpenRelinkModal = async () => {
    if (!selected) return;
    const channels = guildChannels.length > 0 ? guildChannels : await loadGuildChannels();
    if (channels.length === 0) {
      openAlert("No Channel", "No available text channel for relink.");
      return;
    }
    const options = channels.map((channel) => ({
      value: channel.id,
      label: channel.name,
    }));
    const defaultValue =
      selected.channel_id && channels.some((channel) => channel.id === selected.channel_id)
        ? selected.channel_id
        : channels[0].id;
    openSelectModal(
      "Relink Channel",
      "Select a channel and confirm.",
      "Channel",
      options,
      defaultValue,
      async (value) => {
        await handleRelink(value);
      }
    );
  };

  const safeChannelLink = getSafeChannelLink(selected?.channel?.jump_url);

  return (
    <section className="section">
      <div className="section-header">
        <h2>Events</h2>
        <div className="filters">
          {eventType === "custom" && (
            <button type="button" className="secondary" onClick={handleCreateCustom}>
              New Custom Event
            </button>
          )}
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
          <div className="segmented">
            <button
              type="button"
              className={!archivedOnly ? "active" : ""}
              onClick={() => setArchivedOnly(false)}
            >
              Active
            </button>
            <button
              type="button"
              className={archivedOnly ? "active" : ""}
              onClick={() => setArchivedOnly(true)}
            >
              Archived
            </button>
          </div>
        </div>
      </div>
      {notice && <p className="notice">{notice}</p>}
      <div className="grid">
        <div className="list scrollable" onScroll={handleEventListScroll}>
          {loadingInitial && <p className="muted">Loading...</p>}
          {!loadingInitial && events.length === 0 && <p className="muted">No events found.</p>}
          {!loadingInitial &&
            events.map((event) => (
              <button
                key={event.id}
                type="button"
                className={selected?.id === event.id ? "list-item active" : "list-item"}
                onClick={() => {
                  setSelected(event);
                  onSelectEvent(event.id);
                }}
              >
                <div className="list-title">{event.title}</div>
                <div className="list-meta">
                  <span>{event.type}</span>
                  <span>{event.users?.length ?? 0} participants</span>
                </div>
                {(event.channel_id || event.now_running || event.archived) && (
                  <div className="list-flags">
                    {event.channel_id && <span className="badge badge-channel">⭐ Channel created</span>}
                    {event.now_running && <span className="badge badge-running">🏃 Now running</span>}
                    {event.archived && <span className="badge badge-archived">📦 Archived</span>}
                  </div>
                )}
              </button>
            ))}
          {loadingMore && <p className="muted">Loading more...</p>}
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
              {safeChannelLink && (
                <a
                  className="link"
                  href={safeChannelLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Discord Channel
                </a>
              )}
              <div className="actions">
                <button type="button" className="primary" onClick={handleJoin}>
                  Join Channel
                </button>
                {canArchive && (
                  <button type="button" className="secondary" onClick={handleArchive}>
                    Archive
                  </button>
                )}
                {canRelink && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={handleOpenRelinkModal}
                  >
                    Relink Channel
                  </button>
                )}
              </div>
              <div className="detail-sub detail-sub-spacious">
                <span className="label">Joined Users</span>
                {(selected.users ?? []).length === 0 && (
                  <p className="muted">No joined users.</p>
                )}
                <div className="list scrollable detail-list">
                  {(selected.users ?? []).map((user) => (
                    <button
                      key={user.discord_id}
                      type="button"
                      className="list-item detail-list-item"
                      onClick={() => onOpenUser(user.discord_id)}
                    >
                      <div className="list-title">
                        {user.discord?.display_name ?? user.discord?.name ?? "Unknown user"}
                      </div>
                      <div className="list-meta">
                        <span>ID: {user.discord_id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Select an event to view details.</p>
          )}
        </div>
      </div>
      <Modal
        open={modalOpen}
        variant={modalVariant}
        title={modalTitle}
        message={modalMessage}
        inputLabel={modalInputLabel}
        inputPlaceholder={modalInputPlaceholder}
        inputDefaultValue={modalInputDefault}
        selectOptions={modalSelectOptions}
        confirmLabel={modalConfirmLabel}
        onCancel={() => setModalOpen(false)}
        onConfirm={(value) => {
          setModalOpen(false);
          modalAction(value);
        }}
      />
    </section>
  );
}
