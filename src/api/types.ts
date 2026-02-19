export type DiscordChannel = {
  id: string;
  jump_url: string;
  name: string;
};

export type DiscordCategory = {
  id: string;
  jump_url: string;
  name: string;
};

export type DiscordRole = {
  id: string;
  name: string;
};

export type EventItem = {
  id: string;
  archived: boolean;
  event_id?: string | null;
  title: string;
  start?: string | null;
  finish?: string | null;
  channel_id?: string | null;
  channel?: DiscordChannel | null;
  scheduled_event_id?: string | null;
  now_running?: boolean | null;
  type: "ctftime" | "custom";
  users?: UserSimple[];
};

export type DiscordUser = {
  display_name: string;
  id: string;
  name: string;
};

export type UserSimple = {
  discord_id: string;
  user_role: ("Administrator" | "pm" | "member")[];
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
  guild_id: string;
  guild_name: string;
  config: ConfigItem[];
};

export type GeneralResponse = {
  success: boolean;
  message: string;
};
