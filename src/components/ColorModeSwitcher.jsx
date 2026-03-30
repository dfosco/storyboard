import { useEffect, useLayoutEffect } from 'react'
import { useTheme, ActionMenu, ActionList, Stack } from '@primer/react'
import { SunIcon, MoonIcon } from '@primer/octicons-react'

import styles from './ColorModeSwitcher.module.css'

const THEME_STORAGE_KEY = 'sb-color-scheme'

function ColorModeSwitcher() {
    const { setDayScheme, setNightScheme, colorScheme } = useTheme()

    // On mount, restore saved theme from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY)
        if (saved) {
            setDayScheme(saved)
            setNightScheme(saved)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Keep data-sb-theme attribute in sync
    useLayoutEffect(() => {
        document.documentElement.setAttribute('data-sb-theme', colorScheme)
    }, [colorScheme])

    const setScheme = (schemeValue) => {
        setDayScheme(schemeValue)
        setNightScheme(schemeValue)
        localStorage.setItem(THEME_STORAGE_KEY, schemeValue)
    }

    const schemes = [
        {
            name: 'Light',
            value: 'light',
            icon: SunIcon,
        },
        {
            name: 'Light colorblind',
            value: 'light_colorblind',
            icon: SunIcon,
        },
        {
            name: 'Dark',
            value: 'dark',
            icon: MoonIcon,
        },
        {
            name: 'Dark colorblind',
            value: 'dark_colorblind',
            icon: MoonIcon,
        },
        {
            name: 'Dark high contrast',
            value: 'dark_high_contrast',
            icon: MoonIcon,
        },
        {
            name: 'Dark Dimmed',
            value: 'dark_dimmed',
            icon: MoonIcon,
        },
    ]

    const current = schemes.find((scheme) => scheme.value === colorScheme) || schemes[0]

    return (
        <Stack padding="normal" className={styles.container}>
            <Stack
                className={styles.buttonWrapper}
            >
                <ActionMenu>
                    <ActionMenu.Button size="small">
                        <current.icon />
                        <span className={styles.label}>
                            {current.name}
                        </span>
                    </ActionMenu.Button>
                    <ActionMenu.Overlay align="right">
                        <ActionList showDividers>
                            <ActionList.Group selectionVariant="single">
                                {schemes.map((scheme) => (
                                    <ActionList.Item
                                        key={scheme.value}
                                        href="#"
                                        selected={scheme.value === colorScheme}
                                        onSelect={() => setScheme(scheme.value)}
                                    >
                                        {scheme.name}
                                    </ActionList.Item>
                                ))}
                            </ActionList.Group>
                        </ActionList>
                    </ActionMenu.Overlay>
                </ActionMenu>
            </Stack>
        </Stack>
    )
}

export default ColorModeSwitcher