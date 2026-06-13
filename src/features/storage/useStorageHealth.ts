import { useState, useEffect } from 'preact/hooks'

export interface StorageHealth {
  usageMB: number
  quotaMB: number
  persistenceGranted: boolean | null
  isWarning: boolean
}

const WARNING_MB = 40
const CHECK_INTERVAL_MS = 30_000

export function useStorageHealth(): StorageHealth | null {
  const [health, setHealth] = useState<StorageHealth | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!navigator.storage?.estimate) return

      const estimate = await navigator.storage.estimate()
      const persisted = navigator.storage.persisted
        ? await navigator.storage.persisted()
        : null

      if (cancelled) return

      const usageBytes = estimate.usage ?? 0
      const quotaBytes = estimate.quota ?? 0
      const usageMB = usageBytes / (1024 * 1024)
      const quotaMB = quotaBytes / (1024 * 1024)

      setHealth({
        usageMB,
        quotaMB,
        persistenceGranted: persisted,
        isWarning: usageMB >= WARNING_MB || persisted === false,
      })
    }

    check()
    const id = setInterval(check, CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return health
}
