import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="vedic" title="吠陀占星" description="印度占星星宿分析" requiresProfile />
    </Suspense>
  );
}
