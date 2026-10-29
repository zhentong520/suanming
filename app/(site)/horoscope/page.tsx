import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="horoscope" title="西洋星座" description="十二星座运势" requiresProfile />
    </Suspense>
  );
}
