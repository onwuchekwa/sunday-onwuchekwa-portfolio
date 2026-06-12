import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  theme: {
    defaultTheme: 'portfolio',
    themes: {
      portfolio: {
        dark: false,
        colors: {
          primary: '#2C3E50',
          secondary: '#8B7355',
          accent: '#C4A35A',
          background: '#FAF8F5',
          surface: '#FFFFFF',
          'surface-variant': '#F0EDE8',
          'on-background': '#1A1A2E',
          'on-surface': '#1A1A2E',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg', elevation: 1 },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
  },
})
