import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="qizheng" title="七政四余" description="七政四余星命" requiresProfile />
    </Suspense>
  );
}
