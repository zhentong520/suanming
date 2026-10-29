import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function MatchPage() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="match"
        title="合婚配对"
        description="生肖五行合盘。先选好「当前档案」作为本人，再从下拉列表选择对方档案。"
        requiresProfile
        fields={[{ name: "profileIdB", label: "对方档案", type: "profile-select", required: true }]}
      />
    </Suspense>
  );
}
