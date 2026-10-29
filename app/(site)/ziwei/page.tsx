import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="ziwei" title="紫微斗数" description="紫微命盘十二宫" requiresProfile />
    </Suspense>
  );
}
