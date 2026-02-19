import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type {
  ConfigItem,
  ConfigResponse,
  DiscordCategory,
  DiscordChannel,
  DiscordRole,
  GeneralResponse,
} from "../../api/types";
import Modal from "../../components/Modal";

type ConfigState = ConfigItem & { draft: string };

export default function ConfigSection() {
  const [configs, setConfigs] = useState<ConfigState[]>([]);
  const [guildChannels, setGuildChannels] = useState<DiscordChannel[]>([]);
  const [guildCategories, setGuildCategories] = useState<DiscordCategory[]>([]);
  const [guildRoles, setGuildRoles] = useState<DiscordRole[]>([]);
  const [notice, setNotice] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const formatErrorDetails = (data: unknown) => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const formatStatusMessage = (message: string) => {
    if (!message.includes(" ID:")) return message;
    return message.replace(/\s+ID:\s*/, "\nID: ");
  };

  const getConfigKind = (key: string) => {
    if (key.endsWith("CHANNEL_ID")) return "Channel";
    if (key.endsWith("CATEGORY_ID")) return "Category";
    if (key.endsWith("ROLE_ID")) return "Role";
    return "";
  };

  const getOptionsByKey = (key: string) => {
    if (key.endsWith("CHANNEL_ID")) return guildChannels;
    if (key.endsWith("CATEGORY_ID")) return guildCategories;
    if (key.endsWith("ROLE_ID")) return guildRoles;
    return [];
  };

  const loadGuildOptions = async () => {
    const [channelResult, categoryResult, roleResult] = await Promise.all([
      apiRequest<DiscordChannel[]>(API_ENDPOINTS.guild.textChannels),
      apiRequest<DiscordCategory[]>(API_ENDPOINTS.guild.categories),
      apiRequest<DiscordRole[]>(API_ENDPOINTS.guild.roles),
    ]);
    setGuildChannels(channelResult.ok && channelResult.data ? channelResult.data : []);
    setGuildCategories(categoryResult.ok && categoryResult.data ? categoryResult.data : []);
    setGuildRoles(roleResult.ok && roleResult.data ? roleResult.data : []);
  };

  const loadConfig = async () => {
    const result = await apiRequest<ConfigResponse>(API_ENDPOINTS.config.list);
    if (result.ok && result.data) {
      setConfigs(
        result.data.config.map((item) => ({
          ...item,
          draft: item.value === null || item.value === undefined ? "" : String(item.value),
        }))
      );
      setNotice("");
      setCanEdit(true);
    } else {
      setConfigs([]);
      const detail = formatErrorDetails(result.errorData);
      setNotice(detail ? `${result.error ?? "Failed to load config"}\n${detail}` : result.error ?? "Failed to load config");
      setCanEdit(result.status !== 403);
    }
  };

  useEffect(() => {
    loadConfig();
    loadGuildOptions();
  }, []);

  const updateConfig = async (item: ConfigState) => {
    if (!canEdit) return;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.config.update(item.key), {
      method: "PATCH",
      body: JSON.stringify({ value: item.draft }),
    });
    setModalTitle(result.ok ? "Success" : "Failed");
    const detail = result.ok ? "" : formatErrorDetails(result.errorData);
    setModalMessage(
      result.ok
        ? "Config updated"
        : detail
          ? `${result.error ?? "Failed to update config"}\n${detail}`
          : result.error ?? "Failed to update config"
    );
    setModalOpen(true);
    if (result.ok) {
      loadConfig();
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2>Config</h2>
        <button type="button" className="secondary" onClick={loadConfig}>
          Refresh
        </button>
      </div>
      {notice && <p className="notice">{notice}</p>}
      {!canEdit && (
        <p className="muted">Administrator permission required to view or edit config.</p>
      )}
      <div className="config-grid">
        {configs.map((item) => (
          <div key={item.key} className="config-card">
            <div>
              <div className="list-title">{item.key}</div>
              <p className="muted">{item.description}</p>
              <div className="config-meta">
                <div className="config-value-row">
                  <span className="config-value-label">Value</span>
                  <span className="config-value-text">{formatValue(item.value)}</span>
                </div>
                {getConfigKind(item.key) && (
                  <div className="config-mapped">
                    <span className="config-mapped-label">Type</span>
                    <span className="config-mapped-badge">{getConfigKind(item.key)}</span>
                  </div>
                )}
              </div>
              <p className={item.ok ? "status ok" : "status error"}>{formatStatusMessage(item.message)}</p>
            </div>
            <div className="config-edit">
              {getOptionsByKey(item.key).length > 0 ? (
                <select
                  value={item.draft}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const next = configs.map((config) =>
                      config.key === item.key ? { ...config, draft: event.target.value } : config
                    );
                    setConfigs(next);
                  }}
                >
                  <option value="">(None)</option>
                  {getOptionsByKey(item.key).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} ({option.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={item.draft}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const next = configs.map((config) =>
                      config.key === item.key ? { ...config, draft: event.target.value } : config
                    );
                    setConfigs(next);
                  }}
                />
              )}
              <button
                type="button"
                className="primary"
                disabled={!canEdit}
                onClick={() => updateConfig(item)}
              >
                Save
              </button>
            </div>
          </div>
        ))}
        {configs.length === 0 && canEdit && <p className="muted">No config items.</p>}
      </div>
      <Modal
        open={modalOpen}
        variant="alert"
        title={modalTitle}
        message={modalMessage}
        onCancel={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
      />
    </section>
  );
}
