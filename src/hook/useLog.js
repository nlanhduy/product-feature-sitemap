import { useEffect } from 'react'

export function useLog(value, label = 'Value') {
  useEffect(() => {
    console.log(`${label}:`, value)
  }, [label, value])
}
