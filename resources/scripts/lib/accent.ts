export const ACCENT_STORAGE_KEY = 'panel:accent-color';

export type AccentName = 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'pink' | 'teal' | 'yellow';

export interface AccentColor {
    name: AccentName;
    label: string;
    hex: string;
    rgb: string;
}

export const ACCENT_COLORS: AccentColor[] = [
    { name: 'purple', label: 'Purple', hex: '#7C3AED', rgb: '124, 58, 237' },
    { name: 'blue', label: 'Blue', hex: '#3B82F6', rgb: '59, 130, 246' },
    { name: 'green', label: 'Green', hex: '#22C55E', rgb: '34, 197, 94' },
    { name: 'red', label: 'Red', hex: '#EF4444', rgb: '239, 68, 68' },
    { name: 'orange', label: 'Orange', hex: '#F97316', rgb: '249, 115, 22' },
    { name: 'pink', label: 'Pink', hex: '#EC4899', rgb: '236, 72, 153' },
    { name: 'teal', label: 'Teal', hex: '#14B8A6', rgb: '20, 184, 166' },
    { name: 'yellow', label: 'Yellow', hex: '#EAB308', rgb: '234, 179, 8' },
];

export const DEFAULT_ACCENT: AccentColor = ACCENT_COLORS.find((color) => color.name === 'red') || ACCENT_COLORS[0];

export const getAccentByName = (name?: string | null): AccentColor =>
    ACCENT_COLORS.find((color) => color.name === name) || DEFAULT_ACCENT;

export const readStoredAccent = (): AccentColor => {
    if (typeof window === 'undefined') {
        return DEFAULT_ACCENT;
    }

    return getAccentByName(window.localStorage.getItem(ACCENT_STORAGE_KEY));
};

export const applyAccentToDocument = (accent: AccentColor): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.style.setProperty('--panel-accent', accent.hex);
    document.documentElement.style.setProperty('--panel-accent-rgb', accent.rgb);
};
