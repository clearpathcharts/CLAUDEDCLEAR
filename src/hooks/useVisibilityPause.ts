import { useEffect, useState } from "react"

export function useVisibilityPause() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onVisibilityChange = () => {
      setVisible(document.visibilityState === "visible")
    }

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    )

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      )
    }
  }, [])

  return visible
}
