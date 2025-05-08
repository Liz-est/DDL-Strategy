import { legacyLogicalPropertiesTransformer, StyleProvider } from '@ant-design/cssinjs'
import { ThemeContextProvider } from '@dify-chat/theme'
import ReactDOM from 'react-dom/client'

import App from './App'

const rootEl = document.getElementById('root')
if (rootEl) {
	const root = ReactDOM.createRoot(rootEl)
	root.render(
		<ThemeContextProvider>
			<StyleProvider
				hashPriority="high"
				transformers={[legacyLogicalPropertiesTransformer]}
			>
				<App />
			</StyleProvider>
		</ThemeContextProvider>,
	)
}
