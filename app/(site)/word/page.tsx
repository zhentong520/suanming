import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function WordPage() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="word"
        title="测字"
        description="汉字测字断事"
        fields={[
          { name: "chars", label: "汉字（1-3字）", required: true, placeholder: "如：福" },
          { name: "question", label: "所问事项", placeholder: "如：今年事业" },
        ]}
      />
    </Suspense>
  );
}
