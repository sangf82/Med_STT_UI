'use client';

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-[44px] h-[24px] rounded-[12px] bg-toggle-bg" />
    }

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative w-[44px] h-[24px] rounded-[12px] bg-toggle-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: isDark ? 'var(--toggle-active)' : 'var(--toggle-bg)' }}
            aria-label="Toggle theme"
        >
            <div
                className="absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow flex items-center justify-center transition-all duration-200"
                style={{ left: isDark ? '22px' : '2px' }}
            >
                {isDark ? (
                    <Moon className="w-3 h-3 text-toggle-active" />
                ) : (
                    <Sun className="w-3 h-3 text-toggle-bg" />
                )}
            </div>
        </button>
    )
}
