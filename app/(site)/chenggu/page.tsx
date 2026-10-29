import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function ChengguPage() {
  return (
    <Suspense>
      <GenericModulePage moduleId="chenggu" title="袁天罡称骨" description="称骨歌诀与命格等级" requiresProfile />
    </Suspense>
  );
}
