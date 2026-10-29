import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function WuxingRenPage() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="wuxing-ren"
        title="五行人·助运"
        description="形神五行看性情身心，按日支取「我生」色借天时；有档案可兼顾八字喜用"
        fields={[
          {
            name: "bodyType",
            label: "体貌五行（可选，不选则用档案日主）",
            type: "select",
            defaultValue: "",
            options: [
              { value: "", label: "不选 · 优先用当前档案日主" },
              { value: "木", label: "木型 · 瘦长耸直、四肢细长" },
              { value: "火", label: "火型 · 面润目亮、语速偏快" },
              { value: "土", label: "土型 · 面阔鼻丰、敦厚沉稳" },
              { value: "金", label: "金型 · 骨感棱角、气场肃整" },
              { value: "水", label: "水型 · 柔韧善变、眼神深" },
            ],
          },
          {
            name: "date",
            label: "助运日期（穿衣）",
            type: "date",
            defaultValue: new Date().toISOString().slice(0, 10),
          },
        ]}
      />
    </Suspense>
  );
}
