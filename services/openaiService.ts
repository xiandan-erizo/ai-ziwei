import { Astrolabe } from "../types";
import { formatChartAsText } from "./iztroService";

type StreamOptions = {
    onToken?: (chunk: string) => void;
    onReasoningToken?: (chunk: string) => void;
};

export const analyzeChart = async (astrolabe: Astrolabe, options?: StreamOptions): Promise<string> => {
    // Support both Vite runtime env (import.meta.env) and build-time injected process.env
    const viteEnv = (typeof import.meta !== "undefined" && (import.meta as any)?.env) || {};
    const apiKey = viteEnv.OPENAI_API_KEY || viteEnv.API_KEY || process.env.OPENAI_API_KEY || process.env.API_KEY;
    // If OPENAI_PROXY_PATH is provided, hit same-origin proxy to avoid CORS; otherwise call direct base.
    const proxyPath = ((viteEnv.OPENAI_PROXY_PATH || process.env.OPENAI_PROXY_PATH || "") as string).trim();
    const directBase = (viteEnv.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com") as string;
    const apiBase = ((proxyPath && proxyPath.length > 0) ? proxyPath : directBase).replace(/\/$/, "");
    const model = (viteEnv.OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini") as string;

    // 在前端场景允许缺省 apiKey（通过同源反向代理在网关端注入），仅当没有代理且缺少 apiKey 时才报错
    if (!apiBase.startsWith("/api") && !apiKey) {
        throw new Error("OpenAI API key not found");
    }
    
    // Use the exact same plain-text chart output as the UI “复制”按钮，避免二次封装导致口径差异
    const context = formatChartAsText(astrolabe);
    const systemPrompt = `
        你是一位“紫微斗数 + 八字”合参的命理分析师，同时具备严谨的证据意识与结构化表达能力。
        你必须严格遵守以下规则：
        1）只使用我提供的盘面信息推断，不允许补星、不允许臆测缺失字段。任何结论必须能回指到盘面证据（宫位/星曜/四化/三方四正/空宫借星/大限流年流月/八字四柱等）。
        2）输出中必须明确：哪些是“盘面显示”，哪些是“推断”，并给出推断置信度（高/中/低）。
        3）涉及健康、法律、投资等内容，只能给风险提示与一般建议，不得做确定性诊断或保证收益。
        4）若发现口径冲突（例如 focusDate 不一致、providerSect/sect 不一致、太阳时定义不一致），必须优先指出冲突并说明其对结果的影响。
        `
    const userPrompt = `
【输入】
- 盘面文本（包含：规则版本、星曜表版本、出生信息、八字命盘、大运、太阳时口径、focusDate、紫微12宫、空宫借星、三方四正、四化落点、本命/大限/流年/流月信息）：
${context}

【任务】
请完成一份解读报告，结构固定如下：

A. 盘面校验与口径摘要（必须）
- 关键元数据：性别、阳历/农历、时辰、五行局、命主/身主、规则版本、星曜表版本、providerSect/sect、yearRule/monthRule、focusDate
- 校验点：流年/流月是否与 focusDate 匹配；四化落点是否与各宫星曜标注一致；空宫借星/三方四正是否自洽
- 如果存在疑点/冲突：逐条列出，并说明会影响哪些判断

B. 本命总格局（紫微为主，八字为辅）
- 命宫主星与结构：命宫主星、对宫、三方四正，形成的性格/能力画像（3-6条）
- 身宫落点与身主：对行为模式/压力来源的补充
- 本命四化落点的核心含义：禄/权/科/忌分别落在哪个宫，对应的主题是什么

C. 六大主题分述（每一段必须引用证据）
1）事业/职场（官禄宫 + 三方四正 + 四化 + 大限/流年叠加）
2）财运/资产（财帛宫 + 田宅宫 + 禄存等 + 四化）
3）感情/婚姻（夫妻宫 + 对宫官禄 + 四化忌位）
4）家庭/亲缘（父母宫/田宅宫/子女宫）
5）人际/合作（仆役宫/迁移宫/福德宫）
6）身心与风险提示（疾厄宫 + 八字结构作旁证；只做风险提示与生活建议）

每个主题输出格式：
- 结论要点（2-4条）
- 证据（引用盘面字段/宫位/星曜/四化落点/三方四正/空宫借星）
- 置信度（高/中/低）
- 建议（可执行、非迷信化表达）

D. 运势聚焦：围绕 focusDate（必须）
- 当前大限：大限范围、宫干、该大限四化落点的主题
- 当年流年：流年四化落点 + 流年命宫落点（如果有）
- 当月流月：流月范围、流月四化落点 + 流月命宫
- 叠加解读：用“同宫叠加/对宫冲照/三方会照”说明“为什么本月/本年更容易发生什么”
- 给出未来 1-3 个月的“关注点清单”（3-6条），每条带证据与置信度

E. 八字侧交叉验证（必须）
- 用八字：日主强弱倾向（只根据你文本里可用信息，不强行定格局）、十神分布特征、刑冲合会/空亡/神煞提示
- 与紫微结论的“共振点/冲突点”各 2-4 条
- 若冲突：说明“以紫微/八字哪个为主、为什么”

F. 最终摘要（给产品用）
- 一句话定位（不超过 30 字）
- 关键优势 3 条、关键风险 3 条（每条能回指证据）
- 建议行动 5 条（务实可执行）

【输出要求】
- 语言：中文
- 风格：专业、克制、可验证
- 不要输出玄学套路句；不要“必然/一定/注定”。
- 每条关键结论后面用括号写证据来源，例如：〔夫妻宫：武曲化忌+破军；四化忌落夫妻；对宫官禄〕
`;

    try {
        const response = await fetch(`${apiBase}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({
                model,
                temperature: 0.6,
                stream: Boolean(options?.onToken),
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const message = errorBody?.error?.message || response.statusText;
            throw new Error(`OpenAI request failed: ${response.status} ${message}`);
        }

        // Streaming path
        if (options?.onToken) {
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("ReadableStream not supported in this environment");
            }
            const decoder = new TextDecoder("utf-8");
            let full = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const parts = buffer.split(/\n\n/);
                buffer = parts.pop() || "";

                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith("data:")) continue;
                    const payload = line.replace(/^data:\s*/, "");
                    if (payload === "[DONE]") {
                        return full || "";
                    }
                    try {
                        const json = JSON.parse(payload);
                        const delta = json?.choices?.[0]?.delta;
                        const contentParts = Array.isArray(delta?.content)
                            ? delta.content
                                  .map((c: any) => c?.text || "")
                                  .join("")
                            : (delta?.content ?? delta?.text ?? json?.choices?.[0]?.text ?? "");

                        const reasoningPart = delta?.reasoning_content || "";

                        if (contentParts) {
                            full += contentParts;
                            options.onToken?.(contentParts);
                        }
                        if (reasoningPart) {
                            options.onReasoningToken?.(reasoningPart);
                        }
                    } catch (err) {
                        console.warn("Stream parse error", err);
                    }
                }
            }

            // Flush remaining buffer if any
            if (buffer) {
                try {
                    const json = JSON.parse(buffer.replace(/^data:\s*/, ""));
                    const delta = json?.choices?.[0]?.delta;
                    const contentParts = Array.isArray(delta?.content)
                        ? delta.content
                              .map((c: any) => c?.text || "")
                              .join("")
                        : (delta?.content ?? delta?.text ?? json?.choices?.[0]?.text ?? "");
                    const reasoningPart = delta?.reasoning_content || "";
                    if (contentParts) {
                        full += contentParts;
                        options.onToken?.(contentParts);
                    }
                    if (reasoningPart) {
                        options.onReasoningToken?.(reasoningPart);
                    }
                } catch (err) {
                    // ignore trailing parse errors
                }
            }
            return full || "";
        }

        // Non-streaming path
        const data = await response.json();
        const message = data?.choices?.[0]?.message;
        const content = message?.content?.trim();
        const reasoning = message?.reasoning_content;
        if (reasoning) {
            options?.onReasoningToken?.(reasoning);
        }
        return content || "无法生成分析结果。";
    } catch (error) {
        console.error("OpenAI analysis failed:", error);
        return "与命理AI连接时发生错误，请稍后再试。";
    }
};
