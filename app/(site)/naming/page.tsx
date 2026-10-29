import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="naming"
        title="起名取名"
        description="结合八字喜用 + 五格三才 + 精品字义排序推荐"
        requiresProfile
        fields={[
          { name: "surname", label: "姓氏", defaultValue: "张", required: true, placeholder: "如：张 / 欧阳" },
          {
            name: "gender",
            label: "孩子性别（可覆盖档案）",
            type: "select",
            defaultValue: "",
            options: [
              { value: "", label: "跟随当前档案" },
              { value: "男", label: "男" },
              { value: "女", label: "女" },
            ],
          },
          {
            name: "givenLen",
            label: "名字字数",
            type: "select",
            defaultValue: "2",
            options: [
              { value: "2", label: "双字名（推荐）" },
              { value: "1", label: "单字名" },
            ],
          },
          {
            name: "preferredWuxing",
            label: "偏好五行（可留空=用喜用神）",
            type: "select",
            defaultValue: "",
            options: [
              { value: "", label: "自动（八字喜用）" },
              { value: "金", label: "金" },
              { value: "木", label: "木" },
              { value: "水", label: "水" },
              { value: "火", label: "火" },
              { value: "土", label: "土" },
            ],
          },
          {
            name: "count",
            label: "推荐数量",
            type: "select",
            defaultValue: "8",
            options: [
              { value: "6", label: "6个" },
              { value: "8", label: "8个" },
              { value: "10", label: "10个" },
              { value: "12", label: "12个" },
            ],
          },
        ]}
      />
    </Suspense>
  );
}
