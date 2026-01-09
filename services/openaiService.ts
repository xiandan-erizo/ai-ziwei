import { Astrolabe } from "../types";

// Prepare a concise summary for the AI to keep token count reasonable but informative
const preparePromptContext = (astrolabe: Astrolabe): string => {
    let context = `Analyze this Zi Wei Dou Shu (Purple Star Astrology) and BaZi (Eight Characters) chart.\n`;
    context += `User: ${astrolabe.gender}, Five Elements Class: ${astrolabe.fiveElementsClass}.\n`;
    
    if (astrolabe.bazi) {
        const b = astrolabe.bazi;
        context += `BaZi Chart:\n`;
        context += `  Year: ${b.pillars[0].gan.char}${b.pillars[0].zhi.char} (${b.pillars[0].gan.shishen})\n`;
        context += `  Month: ${b.pillars[1].gan.char}${b.pillars[1].zhi.char} (${b.pillars[1].gan.shishen})\n`;
        context += `  Day: ${b.pillars[2].gan.char}${b.pillars[2].zhi.char} (Day Master: ${b.dayMaster})\n`;
        context += `  Hour: ${b.pillars[3].gan.char}${b.pillars[3].zhi.char} (${b.pillars[3].gan.shishen})\n\n`;
    }

    // Focus on key palaces for general life reading
    context += `Zi Wei Dou Shu Chart:\n`;
    astrolabe.palaces.forEach(p => {
        const majors = p.majorStars.map(s => `${s.name}(${s.brightness})`).join(', ');
        // Only include minor stars if they are significant (lucky/unlucky) - simplified here to just list names
        const minors = p.minorStars.map(s => s.name).join(', ');
        
        context += `Palace: ${p.name} (${p.heavenlyStem}${p.earthlyBranch})\n`;
        context += `  Major Stars: ${majors}\n`;
        context += `  Minor Stars: ${minors}\n`;
        
        // Add specific markers
        if (p.isBodyPalace) context += `  [Body Palace]\n`;
        if (p.isOriginalPalace) context += `  [Life Palace]\n`;
        context += `\n`;
    });

    return context;
};

export const analyzeChart = async (astrolabe: Astrolabe): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("OpenAI API key not found");
    }
    
    const context = preparePromptContext(astrolabe);
    const systemPrompt = "你是一位精通紫微斗数与八字命理的大师。";
    const userPrompt = `
${context}

请结合用户的紫微斗数命盘与八字排盘数据（如果提供），提供一份专业、详尽且富有洞察力的中文命理分析。

请按以下 Markdown 格式组织回复：
1. **命局总纲 (Overall Destiny)**: 结合紫微命宫/身宫与八字日主强弱、格局进行综合分析。
2. **事业与财运 (Career & Wealth)**: 基于紫微（官禄、财帛）与八字（正偏财、官杀）的象义进行分析。
3. **情感与人际 (Relationships)**: 基于紫微（夫妻、交友）与八字（夫妻宫、配偶星）进行分析。
4. **流年运势 (Current Luck)**: 如果有流年数据，简单提点近期运势。
5. **造命建议 (Advice)**: 给命主的关键建议，发挥优势，规避弱点。

语气请保持专业、玄妙但又不失落地，多用鼓励性的语言。请务必使用中文回答。
`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0.6,
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

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim();
        return content || "无法生成分析结果。";
    } catch (error) {
        console.error("OpenAI analysis failed:", error);
        return "与命理AI连接时发生错误，请稍后再试。";
    }
};
