/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
        colors: {
          'mint': {
            'DEFAULT': '#1FC7A6',
            'light': '#E9FFF7',
            'dark': '#043228',
          },
          'coral': {
            'DEFAULT': '#FF7043',
            'light': '#FFF0EB',
          },
          'primary': 'rgb(var(--color-primary) / <alpha-value>)',
          'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
          'primary-container': 'rgb(var(--color-primary-container) / <alpha-value>)',
          'on-primary-container': 'rgb(var(--color-on-primary-container) / <alpha-value>)',
          'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
          'on-secondary': 'rgb(var(--color-on-secondary) / <alpha-value>)',
          'secondary-container': 'rgb(var(--color-secondary-container) / <alpha-value>)',
          'on-secondary-container': 'rgb(var(--color-on-secondary-container) / <alpha-value>)',
          'tertiary': 'rgb(var(--color-tertiary) / <alpha-value>)',
          'on-tertiary': 'rgb(var(--color-on-tertiary) / <alpha-value>)',
          'tertiary-container': 'rgb(var(--color-tertiary-container) / <alpha-value>)',
          'on-tertiary-container': 'rgb(var(--color-on-tertiary-container) / <alpha-value>)',
          'error': 'rgb(var(--color-error) / <alpha-value>)',
          'on-error': 'rgb(var(--color-on-error) / <alpha-value>)',
          'error-container': 'rgb(var(--color-error-container) / <alpha-value>)',
          'on-error-container': 'rgb(var(--color-on-error-container) / <alpha-value>)',
          'background': 'rgb(var(--color-background) / <alpha-value>)',
          'on-background': 'rgb(var(--color-on-background) / <alpha-value>)',
          'surface': 'rgb(var(--color-surface) / <alpha-value>)',
          'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
          'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
          'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
          'outline': 'rgb(var(--color-outline) / <alpha-value>)',
          'outline-variant': 'rgb(var(--color-outline-variant) / <alpha-value>)',
          'inverse-surface': 'rgb(var(--color-inverse-surface) / <alpha-value>)',
          'inverse-on-surface': 'rgb(var(--color-inverse-on-surface) / <alpha-value>)',
        },
        fontFamily: {
          sans: ['Roboto', 'sans-serif'],
        },
        fontSize: {
          'display-m': ['2.75rem', { lineHeight: '3.25rem', letterSpacing: '-0.015625em' }],
          'display-l': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.015625em' }],
          '4xl': ['2.375rem', { lineHeight: '2.875rem', letterSpacing: '-0.015625em' }],
          'headline-m': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '0em' }],
          'title-l': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0em' }],
          'title-m': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.009375em' }],
          'body-m': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01785714em' }],
          'label-s': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.04166667em' }],
        },
        animation: {
            searchModalSlideDown: 'searchModalSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            modalSlideUp: 'modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            backdropFadeIn: 'backdropFadeIn 0.35s ease-in-out forwards',
            screenFadeIn: 'screenFadeIn 0.3s ease-out forwards',
            fabPopIn: 'fab-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            dropdownPopIn: 'dropdownPopIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'check-pop': 'check-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            'mintor-open': 'mintorModalOpen 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'mintor-close': 'mintorModalClose 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        },
        keyframes: {
            searchModalSlideDown: {
                '0%': { opacity: 0, transform: 'translateY(-100%)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            modalSlideUp: {
                '0%': { opacity: 0, transform: 'translateY(100%)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            mintorModalOpen: {
                '0%': { opacity: 0, transform: 'scale(0.8)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
            },
            mintorModalClose: {
                '0%': { opacity: 1, transform: 'scale(1)' },
                '100%': { opacity: 0, transform: 'scale(0.8)' },
            },
            backdropFadeIn: {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
            },
            screenFadeIn: {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            'confetti-fall': {
                '0%': { transform: 'translateY(-10vh) rotateZ(0deg)', opacity: 1 },
                '100%': { transform: 'translateY(110vh) rotateZ(720deg)', opacity: 0 },
            },
            'fab-pop-in': {
                '0%': { transform: 'scale(0)', opacity: 0 },
                '100%': { transform: 'scale(1)', opacity: 1 },
            },
            dropdownPopIn: {
                '0%': { opacity: 0, transform: 'scale(0.95) translateY(-5px)' },
                '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
            },
            'dropdown-item-pop': {
                '0%': { opacity: 0, transform: 'translateX(-15px) scale(0.95)' },
                '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
            },
            'check-pop': {
                '0%': { opacity: 0, transform: 'scale(0)' },
                '50%': { transform: 'scale(1.4)' },
                '100%': { transform: 'scale(1)' },
            },
        },
      },
  },
  plugins: [],
}
