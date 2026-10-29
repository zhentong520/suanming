import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="lingqian" title="灵签" description="观音灵签求签" />
    </Suspense>
  );
}
