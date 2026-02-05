/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Backgrounds */
        bg0: 'var(--bg0)',
        bg1: 'var(--bg1)',
        'bg-dark': 'var(--bg-dark)',
        card: 'var(--card)',

        /* Primary Brand */
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-lighter': 'var(--primary-lighter)',

        /* Secondary Brand */
        secondary: 'var(--secondary)',
        'secondary-light': 'var(--secondary-light)',
        accent: 'var(--accent)',

        /* Text */
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        muted2: 'var(--muted2)',

        /* Borders */
        border: 'var(--border)',
        'border-light': 'var(--border-light)',
        divider: 'var(--divider)',

        /* Status Colors */
        danger: 'var(--danger)',
        'danger-light': 'var(--danger-light)',
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        info: 'var(--info)',
        'info-light': 'var(--info-light)',
      },
      borderRadius: {
        sm: 'var(--radius)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-lg)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        'soft': 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        'lg': 'var(--shadow-lg)',
      },
      spacing: {
        'safe-x': '24px',
        'safe-y': '32px',
      },
    },
  },
  plugins: [],
};
