import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ScriptAnalysis, ModelType } from "../types";

// Initialize the client
// NOTE: We assume process.env.API_KEY is available as per instructions.
const getAiClient = () => {
  const customKey = localStorage.getItem('storyboard_pro_custom_api_key');
  const apiKey = customKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
你是一位擁有多年經驗的極其專業的視頻創作者和分鏡畫師，對3到15分鐘的故事性視頻有著非常深刻的理解。
你應站在整個腳本立意的全局視角，拆解腳本，並將其設計成對應的分鏡草圖。
同時，您需要提供與分鏡草圖一一對應的人物台詞、旁白等必要的畫面匹配信息。

整體語調：自信、幽默且富有經驗，像一位和藹又專業的行業前輩。不囉嗦，不說廢話。

規則:
1. 首先，對用戶腳本進行全局立意的概述，用風趣、幽默且淺顯的語言總結核心主題和故事結構。
2. **背景知識與一致性**：
   - 提取腳本中的時代背景（如：清末民初、賽博朋克、現代都市等）。在 "historical_context" 中詳細描述該時代的建築、服裝、道具特徵（英文）。
   - 識別腳本中的主要人物，在 "character_definitions" 中為每個主要人物提供詳細的外貌、服裝描述（英文），以確保在所有分鏡中保持一致。
3. 將腳本分解為所有必要的關鍵場景或鏡頭（**必須完整覆蓋用戶提供的腳本內容，不要遺漏任何情節，哪怕鏡頭數量較多**）。
4. 對於每個分鏡，精確對應地寫出人物台詞、旁白或其他畫面中必須匹配的文本信息。
5. 提供 "visual_prompt"：用於 AI 生成圖片的英文提示詞。**必須包含該鏡頭的構圖、主體、風格、光線，並引用 "character_definitions" 中的人物特徵和 "historical_context" 中的環境特徵，以確保視覺一致性。**
6. **明確區分景別 (Shot Size) 和 拍攝角度 (Camera Angle)。**
7. 提供 "director_note"：提供實用性建議，如 '在這個鏡頭中，建議使用特寫來強調角色的情緒波動'。
8. 除 "visual_prompt"、"historical_context" 和 "character_definitions" 外，所有內容必須使用**中文**回答。
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "分鏡腳本的標題" },
    overview: { type: Type.STRING, description: "對腳本核心主題和結構的幽默且有洞察力的總結（中文）。" },
    style_notes: { type: Type.STRING, description: "總體視覺風格和氛圍建議（中文）。" },
    historical_context: { type: Type.STRING, description: "時代背景、建築、服裝、道具的詳細描述（英文），用於生圖提示詞。" },
    character_definitions: { type: Type.STRING, description: "主要人物的外貌、服裝詳細描述（英文），用於保持分鏡間的人物一致性。" },
    shots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          scene_number: { type: Type.STRING, description: "例如：'第1場' 或 '場景 2'" },
          shot_description: { type: Type.STRING, description: "該鏡頭發生的簡要描述（中文）。" },
          visual_prompt: { type: Type.STRING, description: "用於生成草圖的詳細視覺描述。請使用英文 (English) 以獲得最佳圖像生成效果。必須結合 character_definitions 和 historical_context。" },
          shot_size: { type: Type.STRING, description: "景別。例如：特寫、中景、全景、大遠景（中文）。" },
          camera_angle: { type: Type.STRING, description: "拍攝角度。例如：仰拍、俯拍、平視、上帝視角、荷蘭角（中文）。" },
          camera_movement: { type: Type.STRING, description: "例如：固定鏡頭、向右搖攝、手持跟拍（中文）。" },
          lighting: { type: Type.STRING, description: "例如：高調光、剪影、清晨自然光（中文）。" },
          audio_dialogue: { type: Type.STRING, description: "與該鏡頭精確匹配的對話或旁白（中文）。" },
          director_note: { type: Type.STRING, description: "關於如何有效執行該鏡頭的專家建議（中文）。" }
        },
        required: ["id", "scene_number", "shot_description", "visual_prompt", "shot_size", "camera_angle", "camera_movement", "lighting", "audio_dialogue", "director_note"]
      }
    }
  },
  required: ["title", "overview", "style_notes", "historical_context", "character_definitions", "shots"]
};

/**
 * Analyzes the script and breaks it down into text-based shot descriptions.
 */
export const analyzeScript = async (script: string, requirements: string, era: string): Promise<ScriptAnalysis> => {
  try {
    const userPrompt = `
      這是我需要可視化的腳本內容：
      ---
      ${script}
      ---
      
      時代背景/環境設定：
      ${era || "未指定，請根據腳本內容自動識別。"}
      
      額外的導演要求/限制：
      ${requirements || "無具體要求，請運用你的專業判斷。"}
      
      請將其拆解為分鏡列表。捕捉故事精髓，生成關鍵鏡頭。
      注意：請確保覆蓋腳本的所有部分，如果腳本較長，請生成足夠數量的分鏡來完整表達故事，不要被默認數量限制。
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: ModelType.TEXT_ANALYSIS,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean markdown code blocks if present (common issue with some models)
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    
    return JSON.parse(text) as ScriptAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates a single storyboard image based on a visual prompt.
 */
export const generateShotImage = async (visualPrompt: string, modelName: string = ModelType.IMAGE_2_5_FLASH): Promise<string | null> => {
  try {
    // Standardized Noir/Charcoal Sketch Style for consistency
    // We enforce a dark, serious, and cinematic rough sketch look.
    const stylePrefix = "Professional movie storyboard sketch, masterpiece, rough charcoal and graphite style, deep shadows, high contrast noir aesthetic, atmospheric lighting, 16:9 widescreen composition. ";
    
    // Check if prompt already has the prefix (reuse case) to avoid duplication
    const finalPrompt = visualPrompt.includes("Professional movie storyboard sketch") 
      ? visualPrompt 
      : `${stylePrefix} Scene details: ${visualPrompt}`;

    // Create a new instance to ensure we use the latest API key if it's a paid model
    const currentAi = getAiClient();

    // Add a timeout to prevent hanging forever
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 60000); // 60 seconds timeout
    });

    const generatePromise = currentAi.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    // Extract image
    if (response.candidates && response.candidates[0].content.parts) {
       for (const part of response.candidates[0].content.parts) {
         if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
         }
       }
    }
    return null;
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    // Handle "Requested entity was not found" which usually means API key issues for paid models
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_REQUIRED");
    }
    return null; 
  }
};