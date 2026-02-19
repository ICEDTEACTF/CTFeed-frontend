export const API_ENDPOINTS = {
  auth: {
    discord: "/auth/discord",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  events: {
    listCtfTime: "/event/ctftime",
    listCustom: "/event/custom",
    createCustom: "/event/create_custom_event",
    detail: (id: string) => `/event/${id}`,
    join: (id: string) => `/event/${id}/join`,
    archive: (id: string) => `/event/${id}/archive`,
    relink: (id: string) => `/event/${id}/relink`,
  },
  users: {
    list: "/user/",
    detail: (id: string) => `/user/${id}`,
  },
  config: {
    list: "/config/",
    update: (key: string) => `/config/${key}`,
  },
  guild: {
    textChannels: "/guild/text_channels",
    categories: "/guild/categories",
    roles: "/guild/roles",
  },
};
