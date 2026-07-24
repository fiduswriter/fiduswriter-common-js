/**
 * Standalone i18n runtime for @fiduswriter/frontend.
 *
 * In Django mode, the Django backend serves `/api/jsi18n/` which defines
 * `gettext`, `ngettext`, and `interpolate` globally.  `fwtoolkit` is then
 * initialized with the host page's `gettext`.
 *
 * In standalone mode (no Django), this module provides its own `gettext` /
 * `ngettext` backed by a simple JSON translation catalog.  Translations are
 * loaded per-locale via dynamic `import()`.
 *
 * Usage (standalone):
 *   import { loadTranslations, gettext } from '@fiduswriter/frontend/i18n'
 *   await loadTranslations('de')
 *   console.log(gettext('Page not found'))  // → 'Seite nicht gefunden'
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Flat msgid → msgstr map. */
interface Catalog {
    [msgid: string]: string
}

/** Plural-forms header extracted from the JSON catalog. */
interface PluralForms {
    /** e.g. "nplurals=2; plural=(n != 1);" */
    plural: string
    nplurals: number
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let catalog: Catalog = {}
let pluralForms: PluralForms | null = null

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load translations for *locale* from the package's own `locale/` directory.
 *
 * The JSON files are expected at `../locale/<locale>/messages.json` relative
 * to this module (i.e. they must be shipped in the npm package).
 *
 * Returns `true` if translations were successfully loaded, `false` otherwise
 * (English identity fallback).
 */
export async function loadTranslations(locale: string): Promise<boolean> {
    try {
        // Dynamic import of the pre-compiled JSON catalog.
        // The path prefix depends on how the package is consumed.  We try
        // several relative paths so the module works both in the source tree
        // and after `tsc` compilation to `dist/`.
        const paths = [
            `../locale/${locale}/messages.json`,
            `../../locale/${locale}/messages.json`,
        ]
        let mod: { default?: Catalog } | null = null
        for (const p of paths) {
            try {
                mod = await import(/* webpackIgnore: true */ p)
                break
            } catch {
                // try next path
            }
        }

        if (!mod) {
            catalog = {}
            return false
        }

        const raw = (mod as { default: Catalog }).default || (mod as Catalog)

        // Extract metadata from the "" header entry.
        if (raw[""] && typeof raw[""] === "string") {
            const headerStr = raw[""] as unknown as string
            delete raw[""]
            // Parse plural-forms header if present.
            const pfMatch = headerStr.match(
                /plural-forms:\s*nplurals=(\d+);\s*plural=(.+?);/i
            )
            if (pfMatch) {
                pluralForms = {
                    nplurals: parseInt(pfMatch[1], 10),
                    plural: pfMatch[2],
                }
            }
        }

        catalog = raw
        return true
    } catch {
        catalog = {}
        return false
    }
}

/**
 * Translate *msgid* using the currently loaded catalog.
 *
 * If no catalog is loaded (or the msgid is not found), returns *msgid*
 * unchanged (identity fallback — English).
 */
export function gettext(msgid: string): string {
    if (Object.keys(catalog).length === 0) return msgid
    return catalog[msgid] || msgid
}

/**
 * Translate a plural-aware string.
 *
 * *singular* and *plural* are separated by a null byte in the catalog key
 * (matching the gettext convention).
 */
export function ngettext(
    singular: string,
    plural: string,
    count: number
): string {
    if (Object.keys(catalog).length === 0) {
        return count === 1 ? singular : plural
    }
    const key = `${singular}\x00${plural}`
    const translated = catalog[key]
    if (!translated) {
        return count === 1 ? singular : plural
    }
    if (!pluralForms) {
        return count === 1 ? translated.split("\x00")[0] : translated.split("\x00")[1]
    }

    // Evaluate plural form.
    let index = 0
    try {
        const fn = new Function("n", `return ${pluralForms.plural}`)
        index = fn(count)
    } catch {
        index = count === 1 ? 0 : 1
    }
    if (index >= pluralForms.nplurals) index = 0
    const forms = translated.split("\x00")
    return forms[index] || (count === 1 ? singular : plural)
}

/**
 * Reset the catalog (useful for testing / language switching).
 */
export function clearTranslations(): void {
    catalog = {}
    pluralForms = null
}

/**
 * Return `true` if translations have been loaded.
 */
export function hasTranslations(): boolean {
    return Object.keys(catalog).length > 0
}
