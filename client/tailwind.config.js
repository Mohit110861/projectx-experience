/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ink: '#0a0a0a',
                surface: '#141414',
                raised: '#1c1c1c',
                line: '#2a2a2a',
                bone: '#f4f1ea',
                mute: '#9a9a9a',
                brand: { DEFAULT: '#e3182d', dark: '#b3101f', soft: '#ff4d5e' },
            },
            fontFamily: {
                display: ['Anton', 'Impact', 'sans-serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            letterSpacing: { wider2: '0.3em' },
        },
    },
    plugins: [],
}
