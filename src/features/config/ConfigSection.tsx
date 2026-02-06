import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { ConfigItem, ConfigResponse, GeneralResponse } from "../../api/types";

type ConfigState = ConfigItem & { draft: string };

export default function ConfigSection() {
  const [configs, setConfigs] = useState<ConfigState[]>([]);
  const [notice, setNotice] = useState("");
  const [canEdit, setCanEdit] = useState(true);

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
      setNotice(result.error ?? "Failed to load config");
      setCanEdit(result.status !== 403);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const updateConfig = async (item: ConfigState) => {
    if (!canEdit) return;
    const trimmed = item.draft.trim();
    const asNumber = Number(trimmed);
    const value =
      trimmed !== "" && Number.isFinite(asNumber) && String(asNumber) === trimmed
        ? asNumber
        : item.draft;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.config.update(item.key), {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
    setNotice(result.ok ? "Config updated" : result.error ?? "Failed to update config");
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
              <p className={item.ok ? "status ok" : "status error"}>{item.message}</p>
            </div>
            <div className="config-edit">
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
    </section>
  );
}
