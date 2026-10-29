"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ModulePageShell, useModuleCalc } from "@/components/site/ModulePage";
import { useUser } from "@/components/site/UserProvider";
import { useLocale } from "@/components/site/LocaleProvider";
import { getModuleDefinition } from "@/lib/hub/module-registry";
import { getModuleDescription, getModuleName } from "@/lib/hub/module-i18n";

interface Field {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

function formatProfileOption(p: {
  name: string | null;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: string;
}) {
  const name = p.name?.trim() || "—";
  const gender = p.gender === "男" || p.gender === "女" ? p.gender : "";
  return `${name}（${p.birthYear}-${p.birthMonth}-${p.birthDay}${gender ? ` · ${gender}` : ""}）`;
}

export function GenericModulePage({
  moduleId,
  title,
  description,
  fields = [],
  requiresProfile = false,
}: {
  moduleId: string;
  title: string;
  description: string;
  fields?: Field[];
  requiresProfile?: boolean;
}) {
  const searchParams = useSearchParams();
  const urlProfileId = searchParams.get("profileId");
  const { profiles, activeProfile, loading: userLoading } = useUser();
  const { locale, t } = useLocale();
  const profileId = urlProfileId ?? activeProfile?.id ?? null;
  const { loading, report, aiReport, reportId, error, submit } = useModuleCalc(moduleId, profileId);

  const def = getModuleDefinition(moduleId);
  const localizedTitle = def ? getModuleName(moduleId, locale, def.name) : title;
  const localizedDesc = def ? getModuleDescription(moduleId, locale, def.description) : description;

  const partnerCandidates = profiles.filter((p) => p.id !== profileId);
  const needsPartnerSelect = fields.some((f) => f.type === "profile-select");
  const partnerSelectError =
    needsPartnerSelect && !userLoading && profiles.length > 0 && partnerCandidates.length === 0
      ? t("module.needPartner")
      : "";

  const profileError =
    requiresProfile && !userLoading && !profileId ? t("module.needProfile") : "";

  return (
    <ModulePageShell
      title={localizedTitle}
      description={localizedDesc}
      loading={loading || userLoading}
      report={report}
      aiReport={aiReport}
      reportId={reportId}
      error={error || profileError || partnerSelectError}
      onSubmit={submit}
      activeProfileName={activeProfile?.name ?? undefined}
    >
      {requiresProfile && activeProfile && (
        <p className="active-profile-hint">
          {t("module.currentProfile")}
          <strong>{activeProfile.name ?? "—"}</strong>
          （{activeProfile.birthYear}-{activeProfile.birthMonth}-{activeProfile.birthDay}）
        </p>
      )}
      {fields.map((f) => {
        if (f.type === "profile-select") {
          return (
            <label key={f.name}>
              {f.label}
              <select name={f.name} required={f.required} defaultValue="" disabled={partnerCandidates.length === 0}>
                <option value="" disabled>
                  {partnerCandidates.length === 0 ? t("module.noPartner") : t("module.pickPartner")}
                </option>
                {partnerCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatProfileOption(p)}
                  </option>
                ))}
              </select>
              {partnerCandidates.length === 0 && (
                <span className="field-hint">
                  <Link href="/profiles">{t("module.createProfile")}</Link>
                </span>
              )}
            </label>
          );
        }
        if (f.type === "select" && f.options) {
          return (
            <label key={f.name}>
              {f.label}
              <select name={f.name} required={f.required} defaultValue={f.defaultValue ?? ""}>
                {f.placeholder && (
                  <option value="" disabled>
                    {f.placeholder}
                  </option>
                )}
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <label key={f.name}>
            {f.label}
            {f.type === "textarea" ? (
              <textarea name={f.name} placeholder={f.placeholder} required={f.required} defaultValue={f.defaultValue} />
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                required={f.required}
                defaultValue={f.defaultValue}
              />
            )}
          </label>
        );
      })}
    </ModulePageShell>
  );
}
