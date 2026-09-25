export const isAdminHost = location.hostname.startsWith('admin.')

export const publicSiteOrigin = isAdminHost
  ? `${location.protocol}//${location.host.replace(/^admin\./, '')}`
  : location.origin

export const adminSiteOrigin = isAdminHost
  ? location.origin
  : `${location.protocol}//admin.${location.host.replace(/^www\./, '')}`
