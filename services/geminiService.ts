import { GoogleGenAI } from "@google/genai";
import { Astrolabe, Palace } from "../types";

// Prepare a concise summary for the AI to keep token count reasonable but informative
const preparePromptContext = (astrolabe: Astrolabe): string => {
    let context = `Analyze this Zi Wei Dou Shu (Purple Star Astrology) chart.\n`;
    context += `User: ${astrolabe.gender}, Five Elements: ${astrolabe.fiveElementsClass}.\n\n`;

    // Focus on key palaces for general life reading
    const keyPalaces = ['Life', 'Wealth', 'Career', 'Travel', 'Marriage', 'Fortune'];
    
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
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = preparePromptContext(astrolabe);
    const prompt = `
    ${context}
    
    你是一位精通紫微斗数的大师。根据上述的命盘数据，提供一份专业、详尽且富有洞察力的中文命理分析。
    
    请按以下 Markdown 格式组织回复：
    1. **命宫与性格 (Overall Destiny)**: 基于命宫与身宫的主星与辅星进行分析。
    2. **事业与财运 (Career & Wealth)**: 基于官禄宫和财帛宫进行分析。
    3. **情感与人际 (Relationships)**: 基于夫妻宫与交友/迁移宫进行分析。
    4. **运势建议 (Advice)**: 给命主的关键建议，发挥优势，规避弱点。

    语气请保持专业、玄妙但又不失落地，多用鼓励性的语言。请务必使用中文回答。
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }, // Minimize latency
            }
        });
        
        return response.text || "无法生成分析结果。";
    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return "与命理AI连接时发生错误，请稍后再试。";
    }
};