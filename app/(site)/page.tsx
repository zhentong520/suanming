import { MODULE_DEFINITIONS } from "@/lib/hub/module-registry";
import { getAlmanacForDate } from "@/lib/engine/calendar";
import { HomeClient } from "@/components/site/HomeClient";

export default function HomePage() {
  const almanac = getAlmanacForDate();
  const homeModules = MODULE_DEFINITIONS.filter((m) => m.showOnHome && m.implemented).map((m) => ({
    id: m.id,
    name: m.name,
    path: m.path,
    category: m.category,
    description: m.description,
    implemented: m.implemented,
  }));
  const moduleCount = MODULE_DEFINITIONS.filter((m) => m.implemented).length;

  return (
    <HomeClient
      moduleCount={moduleCount}
      homeModules={homeModules}
      almanac={{
        lunarDate: almanac.lunarDate,
        shengXiao: almanac.shengXiao,
        wuXing: almanac.wuXing,
        yi: almanac.yi,
        ji: almanac.ji,
        chong: almanac.chong,
      }}
    />
  );
}
