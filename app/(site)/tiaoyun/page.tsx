import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function TiaoyunPage() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="tiaoyun"
        title="医·调摄养生"
        description="象数原理、五行养生、能量引导与自我提升——文化自学，不替代医疗"
        fields={[
          {
            name: "concern",
            label: "关注主题",
            type: "select",
            required: true,
            defaultValue: "general",
            options: [
              { value: "general", label: "综合调摄总览" },
              { value: "body", label: "身心倾向（象数·五行养生）" },
              { value: "emotion", label: "情绪与能量（接纳引导）" },
              { value: "luck", label: "状态起伏（自我提升渠道）" },
              { value: "home", label: "居家风水入口" },
              { value: "avatar", label: "头像 / 昵称气场" },
            ],
          },
          {
            name: "focus",
            label: "补充说明（可选）",
            type: "textarea",
            placeholder: "例如：想了解象数怎么自学、最近觉得耗能等（非问诊）",
          },
        ]}
      />
    </Suspense>
  );
}
