export type DiscordChannel = {
  id: number;
  jump_url: string;
  name: string;
};

export type EventItem = {
  id: number;
  archived: boolean;
  event_id?: number | null;
  title: string;
  start?: number | null;
  finish?: number | null;
  channel_id?: number | null;
  channel?: DiscordChannel | null;
  scheduled_event_id?: number | null;
  now_running?: boolean | null;
  type: "ctftime" | "custom";
  users?: UserSimple[];
};

export type DiscordUser = {
  display_name: string;
  id: number;
  name: string;
};

export type UserSimple = {
  discord_id: number;
  status: string;
  skills: string[];
  rhythm_games: string[];
  discord?: DiscordUser | null;
};

export type User = UserSimple & {
  events: EventItem[];
};

export type ConfigItem = {
  key: string;
  description: string;
  message: string;
  value: unknown;
  ok: boolean;
};

export type ConfigResponse = {
  guild_id: number;
  guild_name: string;
  config: ConfigItem[];
};

export type GeneralResponse = {
  success: boolean;
  message: string;
};
