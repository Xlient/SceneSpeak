import { useId } from "react";
import { type LanguageFilter, isCloudOnly } from "@scenespeak/core/language/language-filter";
import { languageName } from "@scenespeak/core/language/languages";

/** Shown on lessons whose replies are always graded in the cloud. */
export const CloudOnlyBadge = ({ language }: { language: string }) =>
  isCloudOnly(language) ? (
    <span className="badge cloud" title={`On-device AI doesn't speak ${languageName(language)} yet, so replies are graded in the cloud`}>
      <span aria-hidden="true">☁️</span> Cloud only
    </span>
  ) : null;

/** Language and level, plus the cloud-only mark when it applies. */
export const LessonLanguageMeta = ({ language, level }: { language: string; level: string }) => (
  <div className="lesson-meta">
    <span className="pill small-pill">
      {languageName(language)} · {level}
    </span>
    <CloudOnlyBadge language={language} />
  </div>
);

export interface LanguageFilterChipsProps {
  options: readonly string[];
  value: LanguageFilter;
  onChange: (value: LanguageFilter) => void;
}

/** "All" plus one chip per language; cloud-only languages carry a cloud mark. */
export const LanguageFilterChips = ({ options, value, onChange }: LanguageFilterChipsProps) => {
  const name = useId();
  const chip = (code: LanguageFilter, label: string, cloud: boolean) => (
    <label key={code ?? "all"} className={`filter-chip ${value === code ? "active" : ""}`}>
      <input type="radio" name={name} checked={value === code} onChange={() => onChange(code)} />
      {label}
      {cloud && (
        <>
          <span className="chip-tag" aria-hidden="true">
            cloud
          </span>
          <span className="visually-hidden"> (cloud only)</span>
        </>
      )}
    </label>
  );
  return (
    <fieldset className="filter-chips">
      <legend className="visually-hidden">Show lessons in</legend>
      {chip(null, "All languages", false)}
      {options.map((code) => chip(code, languageName(code), isCloudOnly(code)))}
    </fieldset>
  );
};
