import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="heluo" title="河洛理数" description="河洛理数命卦" requiresProfile />
    </Suspense>
  );
}
