import { Suspense } from "react";
import { ImageReadingPage } from "@/components/site/ImageReadingPage";

export default function Page() {
  return (
    <Suspense>
      <ImageReadingPage
        moduleId="palm"
        title="手相"
        description="上传清晰手掌照片，AI 深度识图：主线辅线、丘位掌型、四域运势"
      />
    </Suspense>
  );
}
