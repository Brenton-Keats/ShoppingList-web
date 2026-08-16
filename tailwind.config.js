/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a'
				}
			},
			fontSize: {
				'xs-mobile': ['0.75rem', { lineHeight: '1rem' }],
				'sm-mobile': ['0.875rem', { lineHeight: '1.25rem' }],
				'base-mobile': ['1rem', { lineHeight: '1.5rem' }],
				'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }],
				'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl-mobile': ['1.5rem', { lineHeight: '2rem' }]
			},
			spacing: {
				'touch': '44px',
				'touch-lg': '48px'
			},
			minHeight: {
				'touch': '44px',
				'touch-lg': '48px'
			},
			minWidth: {
				'touch': '44px',
				'touch-lg': '48px'
			}
		}
	},
	plugins: []
};
