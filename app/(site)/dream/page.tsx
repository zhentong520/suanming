import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="dream" title="周公解梦" description="梦境关键词解读" fields={[{ name: "keyword", label: "梦境关键词", required: true }]} />
    </Suspense>
  );
}
