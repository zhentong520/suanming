import type { Metadata } from "next";
import { LiuyanWall } from "@/components/site/LiuyanWall";
import { buildMetadataForPath } from "@/lib/seo/build-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadataForPath("/liuyan");
}

export default function LiuyanPage() {
  return (
    <div className="page-container">
      <LiuyanWall />
    </div>
  );
}
