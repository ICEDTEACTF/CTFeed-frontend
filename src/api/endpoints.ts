export const API_ENDPOINTS = {
  auth: {
    discord: "/auth/discord",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  events: {
    list: "/event",
    createCustom: "/event/create_custom_event",
    join: (id: number) => `/event/${id}/join`,
    archive: (id: number) => `/event/${id}/archive`,
    relink: (id: number) => `/event/${id}/relink`,
  },
  users: {
    list: "/user",
  },
  config: {
    list: "/config",
    update: (key: string) => `/config/${key}`,
  },
};
