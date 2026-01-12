import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        // Include a2ui-react components for proper class scanning
        './node_modules/a2ui-react/dist/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // Custom color palette for our task app
            colors: {
                // Priority colors - these are carefully chosen for accessibility
                priority: {
                    high: {
                        bg: '#FEE2E2',     // red-100
                        text: '#DC2626',   // red-600
                        border: '#FECACA', // red-200
                    },
                    medium: {
                        bg: '#FEF3C7',     // amber-100
                        text: '#D97706',   // amber-600
                        border: '#FDE68A', // amber-200
                    },
                    low: {
                        bg: '#D1FAE5',     // emerald-100
                        text: '#059669',   // emerald-600
                        border: '#A7F3D0', // emerald-200
                    },
                },
                // App-specific colors
                surface: {
                    DEFAULT: '#FAFAFA',
                    dark: '#18181B',
                },
            },
            // Smooth animations for a polished feel
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
            // Typography adjustments
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
