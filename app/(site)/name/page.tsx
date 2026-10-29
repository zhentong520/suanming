import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function NamePage() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="name"
        title="姓名测算"
        description="三才五格 + 康熙笔画；有档案时对照八字喜用"
        fields={[
          { name: "name", label: "姓名", required: true, placeholder: "如：张浩然" },
          {
            name: "surnameLen",
            label: "姓氏字数",
            type: "select",
            defaultValue: "1",
            options: [
              { value: "1", label: "单姓（1字）" },
              { value: "2", label: "复姓（2字）" },
            ],
          },
        ]}
      />
    </Suspense>
  );
}
