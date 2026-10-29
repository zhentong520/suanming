import { Suspense } from "react";
import { ImageReadingPage } from "@/components/site/ImageReadingPage";

export default function Page() {
  return (
    <Suspense>
      <ImageReadingPage
        moduleId="face"
        title="面相"
        description="上传清晰正脸照片，AI 深度识图：三停十二宫、事业财运感情健康"
      />
    </Suspense>
  );
}
