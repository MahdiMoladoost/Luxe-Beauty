import { readFile, writeFile } from 'node:fs/promises'

const mobileHookSource = `import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(\`(max-width: \${MOBILE_BREAKPOINT - 1}px)\`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
`

const mobileHookReplacement = `import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = \`(max-width: \${MOBILE_BREAKPOINT - 1}px)\`

function subscribeToMobileQuery(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

function getServerMobileSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot,
  )
}
`

const sidebarSource = `  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return \`\${Math.floor(Math.random() * 40) + 50}%\`
  }, [])
`

const sidebarReplacement = `  const skeletonId = React.useId()
  const widthOffset = Array.from(skeletonId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) % 41
  const width = \`\${50 + widthOffset}%\`
`

const repairs = [
  {
    path: 'components/ui/use-mobile.tsx',
    source: mobileHookSource,
    replacement: mobileHookReplacement,
  },
  {
    path: 'hooks/use-mobile.ts',
    source: mobileHookSource,
    replacement: mobileHookReplacement,
  },
  {
    path: 'components/ui/sidebar.tsx',
    source: sidebarSource,
    replacement: sidebarReplacement,
  },
]

for (const repair of repairs) {
  const current = await readFile(repair.path, 'utf8')

  if (current.includes(repair.replacement)) {
    console.info(`Already repaired: ${repair.path}`)
    continue
  }

  if (!current.includes(repair.source)) {
    throw new Error(`Expected source block was not found in ${repair.path}`)
  }

  await writeFile(
    repair.path,
    current.replace(repair.source, repair.replacement),
    'utf8',
  )
  console.info(`Repaired: ${repair.path}`)
}
