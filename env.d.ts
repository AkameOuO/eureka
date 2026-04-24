/// <reference types="vite/client" />

declare module 'virtual:eurekas-data' {
	import type { EurekasData } from './src/types'

	const data: EurekasData
	export default data
}
