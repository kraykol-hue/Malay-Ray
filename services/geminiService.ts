
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, ImageAnalysisResult } from "../types";

const API_KEY = process.env.API_KEY || '';

// We create a new instance inside functions if we need to ensure latest key, 
// but for the service scope we keep a default one.
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Handle both data URL format and raw base64 if needed, but reader.readAsDataURL returns data URL
      const base64String = result.split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeVideoContent = async (file: File): Promise<AnalysisResult> => {
  try {
    const videoPart = await fileToGenerativePart(file);

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        activeSegments: {
          type: Type.ARRAY,
          description: "List of time segments (start and end in seconds) where active speech is detected, excluding silence/blank spaces.",
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER, description: "Start time in seconds" },
              end: { type: Type.NUMBER, description: "End time in seconds" },
            },
            required: ["start", "end"],
          },
        },
        originalTranscript: {
          type: Type.STRING,
          description: "The verbatim transcript of the speech.",
        },
        enhancedTranscript: {
          type: Type.STRING,
          description: "A polished, grammatically corrected version of the transcript.",
        },
        sentiment: {
          type: Type.STRING,
          description: "Overall sentiment of the speech (e.g., Positive, Neutral, Concerned).",
        },
        summary: {
          type: Type.STRING,
          description: "A concise summary of the content.",
        }
      },
      required: ["activeSegments", "originalTranscript", "enhancedTranscript", "sentiment", "summary"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          videoPart,
          {
            text: `Analyze this video/audio file. 
            1. Identify the exact timestamps where the speaker is actively talking to create a "smart cut" list that removes blank spaces/silence. 
            2. Transcribe the audio accurately.
            3. Provide an enhanced, professional version of the transcript correcting grammar.
            4. Analyze sentiment and summarize.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
};

export const analyzeImage = async (file: File): Promise<ImageAnalysisResult> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Detailed description of the image content." },
        detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of visible objects or people." },
        dominantColors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of dominant colors." },
        creativeCaption: { type: Type.STRING, description: "A creative, engaging caption for social media." },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant hashtags." }
      },
      required: ["description", "detectedObjects", "dominantColors", "creativeCaption", "hashtags"]
    };

    const response = await dynamicAi.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          imagePart,
          { text: "Analyze this image. Describe it in detail, list objects, identifying colors, provide a caption and hashtags." }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as ImageAnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const generateVeoVideo = async (
  params: {
    imageFile?: File | null,
    aspectRatio: '16:9' | '9:16',
    prompt?: string
  }
): Promise<string> => {
  const { imageFile, aspectRatio, prompt } = params;
  
  // Create a new instance to ensure we use the latest API key (e.g. if selected via UI)
  const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let requestParams: any = {
    model: 'veo-3.1-fast-generate-preview',
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  };

  if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      requestParams.image = {
          imageBytes: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType,
      };
      if (prompt) requestParams.prompt = prompt;
  } else {
      if (!prompt) {
          throw new Error("A text prompt is required for video generation when no image is provided.");
      }
      requestParams.prompt = prompt;
  }

  let operation = await dynamicAi.models.generateVideos(requestParams);

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
    operation = await dynamicAi.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!downloadLink) {
      throw new Error("Video generation failed: No video URI returned.");
  }

  // Fetch the actual video content using the key
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
