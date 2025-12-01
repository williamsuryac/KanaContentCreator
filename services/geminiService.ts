
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedContent, Platform, VisualStyle, EnhanceSettings, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const videoIdeaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the video concept" },
    script: { type: Type.STRING, description: "Detailed voiceover or dialogue script" },
    storyboard: { type: Type.STRING, description: "Visual description of scenes/shots" },
  },
  required: ["title", "script", "storyboard"],
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: "Catchy headline for the post" },
    hook: { type: Type.STRING, description: "First line to grab attention" },
    caption: { type: Type.STRING, description: "Full caption body" },
    callToAction: { type: Type.STRING, description: "Engagement prompt" },
    videoIdeas: {
      type: Type.ARRAY,
      items: videoIdeaSchema,
      description: "List of 3 distinct video ideas (Reels/TikToks)",
    },
  },
  required: ["headline", "hook", "caption", "callToAction", "videoIdeas"],
};

export const generateSocialContent = async (
  imageFile: File,
  description: string,
  platform: Platform,
  language: Language
): Promise<GeneratedContent> => {
  const base64Image = await fileToBase64(imageFile);

  const langInstruction = language === 'id' 
    ? "OUTPUT LANGUAGE: Indonesian (Bahasa Indonesia). Use formal yet trendy Indonesian suitable for social media." 
    : "OUTPUT LANGUAGE: English.";

  const systemInstruction = `
    You are Kana Creator, an expert social media strategist and creative director.
    
    TARGET AUDIENCE PROFILE:
    - Age: 18-35 years old (Gen Z & Millennials)
    - Occupation: Office workers, Students, Creatives
    - Persona: Tech-savvy, urban living, minimalists, Apple ecosystem enthusiasts.
    - Tone: Modern, clean, professional yet relatable, witty, authentic. Avoid cringey hashtags or overuse of emojis.
    
    ${langInstruction}

    TASK:
    Analyze the provided image and description to create content for ${platform}.
    
    REQUIREMENTS:
    1. Headline: Short, punchy, aesthetic.
    2. Hook: The first sentence that stops the scroll.
    3. Caption: Engaging narrative that resonates with the urban/tech lifestyle.
    4. Call to Action (CTA): Low friction engagement (e.g., "Save for later", "Share with a coworker").
    5. Video Ideas: Create exactly 3 distinct video concepts (Reels/TikToks) using the image as a reference/thumbnail. Include a Title, detailed Script, and Storyboard description for each.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image,
            },
          },
          {
            text: `Description: ${description}\nPlatform: ${platform}`,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as GeneratedContent;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateVisualContent = async (
  imageFiles: File[],
  context: string,
  style: VisualStyle,
  language: Language
): Promise<string> => {
  
  // Convert all files to base64 parts
  const imageParts = await Promise.all(imageFiles.map(async (file) => ({
    inlineData: {
      mimeType: file.type,
      data: await fileToBase64(file),
    },
  })));
  
  const langContext = language === 'id' ? "If any text is displayed in the image (like for Infographics), it MUST be in Indonesian." : "Text should be in English.";

  const prompt = `
    Create a high-quality, professional Instagram post (vertical 4:5 ratio) featuring these product materials.
    
    Style: ${style}
    Context & Details to include: ${context}
    ${langContext}
    
    Instructions:
    - Use the uploaded images as the source materials for the product composition.
    - If multiple images are provided, arrange them creatively or select the best angle/item to fit the chosen style.
    - If the style is 'Data Infographic' or 'Microblog', incorporate text elements based on the Context provided.
    - If the style is 'Meme', make it witty and relatable to office workers/students.
    - Ensure the aesthetic is modern, clean, and premium (Kana Creator style).
    - The output must be a single generated image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          ...imageParts,
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Closest supported ratio to 4:5
        }
      },
    });

    // Iterate through parts to find the image
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
}

export const enhanceProductImage = async (
  imageFile: File,
  settings: EnhanceSettings
): Promise<string> => {
  const base64Image = await fileToBase64(imageFile);
  
  // Construct background description
  let bgDescription = "clean, studio white background";
  if (settings.backgroundColor === 'Black') bgDescription = "elegant studio black background";
  if (settings.backgroundColor === 'Gray') bgDescription = "neutral gray studio background";
  if (settings.backgroundColor === 'Green Screen') bgDescription = "solid bright green background (hex #00FF00) for chroma keying";
  if (settings.backgroundColor === 'Custom') bgDescription = `solid background with color ${settings.customBackgroundColor}`;
  
  // Construct object color description
  const colorInstruction = settings.objectColor 
    ? `CHANGE PRODUCT COLOR: Change the main product's material color to ${settings.objectColor}. IMPORTANT: The shape, form, geometry, and texture must remain EXACTLY the same as the original image. Do not morph, distort, or reimagine the object. It must look like the exact same object, just painted ${settings.objectColor}.` 
    : "Keep the product colors true to life.";

  const prompt = `
    Transform this product photo into a high-end, studio-quality e-commerce image.
    
    Instructions:
    1. ${colorInstruction}
    2. BACKGROUND: Set to ${bgDescription}.
    3. LIGHTING: Apply soft, balanced, professional studio lighting. Eliminate harsh shadows.
    4. PRESERVE GEOMETRY: The product shape in the output MUST match the input image 100%. Do not add or remove parts of the product.
    5. CLEANUP: Remove any background distractions, text, or clutter, leaving only the product on the requested background.
  `;

  // Handle unsupported 4:5 ratio by mapping to closest supported vertical ratio (3:4)
  const apiAspectRatio = settings.aspectRatio === '4:5' ? '3:4' : settings.aspectRatio;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: apiAspectRatio as any || "1:1",
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Enhance Image Error:", error);
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
