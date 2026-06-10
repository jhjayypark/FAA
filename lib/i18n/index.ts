"use client";

/**
 * Lightweight interface-language layer (English / Korean).
 *
 * UI labels translate; AI-generated and extracted content stays Korean
 * regardless of this setting. Dictionaries are split per module so feature
 * code and its strings live together; every key is prefixed with its module
 * name to avoid collisions.
 */

import { useFAAStore, type InterfaceLanguage } from "@/lib/store";
import { setFormatLocale } from "@/lib/format";
import { COMMON } from "@/lib/i18n/common";
import { INCIDENTS } from "@/lib/i18n/incidents";
import { INCIDENT_DETAIL } from "@/lib/i18n/incident-detail";
import { EXTRACTION } from "@/lib/i18n/extraction";
import { RESULTS } from "@/lib/i18n/results";
import { REPORT } from "@/lib/i18n/report";
import { ASSISTANT } from "@/lib/i18n/assistant";

export type Dict = Record<string, { en: string; ko: string }>;

const DICT: Dict = {
  ...COMMON,
  ...INCIDENTS,
  ...INCIDENT_DETAIL,
  ...EXTRACTION,
  ...RESULTS,
  ...REPORT,
  ...ASSISTANT,
};

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) =>
    name in vars ? String(vars[name]) : m
  );
}

export function translate(
  language: InterfaceLanguage,
  key: string,
  vars?: Vars
): string {
  const entry = DICT[key];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing key: ${key}`);
    }
    return key;
  }
  return interpolate(entry[language], vars);
}

/** Current interface language. */
export function useLanguage(): InterfaceLanguage {
  return useFAAStore((s) => s.settings.language);
}

/**
 * Translation hook. Re-renders on language change.
 *   const t = useT();
 *   t("incidents.title");
 *   t("results.inReportCount", { selected: 3, total: 14 });
 */
export function useT(): (key: string, vars?: Vars) => string {
  const language = useLanguage();
  // Keep date formatting in lib/format.ts in step with the UI language.
  setFormatLocale(language === "ko" ? "ko-KR" : "en-US");
  return (key, vars) => translate(language, key, vars);
}
