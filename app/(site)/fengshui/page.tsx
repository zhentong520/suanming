import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="fengshui"
        title="风水"
        description="八宅命卦 + 玄空年飞星（可填坐向）"
        requiresProfile
        fields={[
          {
            name: "facing",
            label: "房屋朝向（向首）",
            type: "select",
            defaultValue: "南",
            options: [
              { value: "南", label: "南" },
              { value: "北", label: "北" },
              { value: "东", label: "东" },
              { value: "西", label: "西" },
              { value: "东南", label: "东南" },
              { value: "东北", label: "东北" },
              { value: "西南", label: "西南" },
              { value: "西北", label: "西北" },
            ],
          },
          {
            name: "sitting",
            label: "房屋坐向（可留空=自动对宫）",
            type: "select",
            defaultValue: "",
            options: [
              { value: "", label: "自动（朝向对宫）" },
              { value: "北", label: "北" },
              { value: "南", label: "南" },
              { value: "西", label: "西" },
              { value: "东", label: "东" },
              { value: "西北", label: "西北" },
              { value: "东北", label: "东北" },
              { value: "西南", label: "西南" },
              { value: "东南", label: "东南" },
            ],
          },
          {
            name: "houseYear",
            label: "起造/迁入年份（飞星用，默认今年）",
            type: "number",
            placeholder: String(new Date().getFullYear()),
          },
        ]}
      />
    </Suspense>
  );
}
