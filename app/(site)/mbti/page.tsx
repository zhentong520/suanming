import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="mbti"
        title="MBTI配对"
        description="MBTI 趣味配对"
        fields={[
          { name: "typeA", label: "类型 A", required: true, placeholder: "INTJ" },
          { name: "typeB", label: "类型 B", required: true, placeholder: "ENFP" },
        ]}
      />
    </Suspense>
  );
}
