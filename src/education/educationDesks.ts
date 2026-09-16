/** Nested learning desks that live under ClearPath Education (not top-level nav). */
export const EDUCATION_TAB_ID = "ClearPathEducation";

export type EducationLibraryDesk = {
  tabId: "Encyclopedia" | "EncyclopediaOfIndicators" | "LiteracyOS";
  label: string;
  href: string;
  blurb: string;
  accent: string;
};

export const EDUCATION_LIBRARY_DESKS: EducationLibraryDesk[] = [
  {
    tabId: "Encyclopedia",
    label: "Encyclopedia of Finance",
    href: "/encyclopedia",
    blurb: "Concepts, markets, and structured knowledge when you want the why — not just a chart.",
    accent: "#00E5FF",
  },
  {
    tabId: "EncyclopediaOfIndicators",
    label: "Encyclopedia of Indicators",
    href: "/indicators",
    blurb: "Plain explanations of technical and fundamental indicators before you put them on a chart.",
    accent: "#39FF14",
  },
  {
    tabId: "LiteracyOS",
    label: "Literacy OS",
    href: "/literacy",
    blurb: "Personal study desk — vault, sources, briefs, and practice tools at your own pace.",
    accent: "#FFD700",
  },
];

export function isEducationFamilyTab(tabId: string): boolean {
  return (
    tabId === EDUCATION_TAB_ID ||
    EDUCATION_LIBRARY_DESKS.some((desk) => desk.tabId === tabId)
  );
}

export function openEducationDesk(
  tabId: string,
  onNavigate?: (tabId: string) => void
): void {
  const desk = EDUCATION_LIBRARY_DESKS.find((d) => d.tabId === tabId);
  if (onNavigate) {
    onNavigate(tabId);
    return;
  }
  if (desk && typeof window !== "undefined") {
    window.location.assign(desk.href);
  }
}
