import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

type DictionaryItem = {
  id: string;
  name: string;
  description: string;
};

const dictionaryItems: DictionaryItem[] = [
  {
    id: "synonym",
    name: "同/近义词词典",
    description:
      "将政策文件中含义相同或相近的不同词语设为同义词，帮助模型更准确地理解语义，避免因表述差异而遗漏相关内容。例如：“北京”=“首都”。",
  },
  {
    id: "professional",
    name: "专业词汇释义词典",
    description:
      "为政策文件中的专业术语提供自然语言解释，使模型能够掌握精准含义进行推理，而非仅字面理解。例如：“高精尖创新中心”是指由北京市政府主导建设、依托属地高校、多创新主体参与、相对独立运行的大型科技创新平台。",
  },
  {
    id: "sensitive",
    name: "敏感词/禁止词词典",
    description:
      "在政策文本生成或编辑时使用，系统识别并标注敏感词或禁止词，提醒用户修改，确保内容合规。",
  },
  {
    id: "fixed",
    name: "固定表述",
    description:
      "维护政府公文规范表述，如将过时称谓（旧称）替换为当前官方认可的表述（新称），保持信息准确与时效。",
  },
  {
    id: "abbreviation",
    name: "缩略词词典",
    description: "对缩略语进行解释与补全，帮助大模型更好地理解政策中的缩略语。",
  },
];

export default function PolicyDictionary() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] space-y-4 p-5 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/policy-writing")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          返回政策制定
        </button>

        <Card className="overflow-hidden border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafafa]">
                  <th className="w-[180px] px-6 py-4 text-left font-semibold text-foreground">词典名称</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">词典描述</th>
                  <th className="w-[100px] px-6 py-4 text-center font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {dictionaryItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="align-top px-6 py-5 font-medium text-foreground">{item.name}</td>
                    <td className="align-top px-6 py-5 leading-7 text-muted-foreground">{item.description}</td>
                    <td className="align-top px-6 py-5 text-center">
                      <button type="button" className="text-primary transition-colors hover:text-primary/80">
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
