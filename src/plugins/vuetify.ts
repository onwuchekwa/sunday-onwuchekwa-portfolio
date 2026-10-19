import 'vuetify/styles'
import { h } from 'vue'
import { createVuetify, type IconProps, type IconSet } from 'vuetify'
import { aliases, mdi as mdiSvg } from 'vuetify/iconsets/mdi-svg'
import { mdi as mdiFont } from 'vuetify/iconsets/mdi'
import { ICON_PATHS } from './iconPaths'

let fontRequested = false

/**
 * Icons are written as "mdi-*" names (in templates and in admin-edited content). Known names
 * render as inline SVG from ICON_PATHS; anything else falls back to the Material Design Icons
 * font, which is only downloaded the first time such a name appears.
 */
const named: IconSet = {
  component: (props: IconProps) => {
    const path = typeof props.icon === 'string' ? ICON_PATHS[props.icon] : undefined
    if (path) return h(mdiSvg.component, { ...props, icon: path })
    if (!fontRequested) {
      fontRequested = true
      void import('@mdi/font/css/materialdesignicons.css')
    }
    return h(mdiFont.component, props)
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'portfolio',
    themes: {
      portfolio: {
        dark: false,
        colors: {
          primary: '#002E5D',
          secondary: '#0047BA',
          accent: '#BDD6E6',
          background: '#FAF8F4',
          surface: '#FFFFFF',
          'surface-variant': '#F5F8FA',
          'on-surface-variant': '#1F2933',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-background': '#1F2933',
          'on-surface': '#1F2933',
        },
      },
    },
  },
  icons: {
    defaultSet: 'named',
    // Vuetify's own icons (close, expand, checkboxes, …) come as "svg:" paths.
    aliases,
    sets: { named, svg: mdiSvg, mdi: mdiFont },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg', elevation: 0, border: true },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
  },
})
