import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ParsedItem {
  name: string;
  quantity: number;
  price: number;
}

export async function parseTamilBillText(text: string, existingProducts: { id: number, name: string, price: number }[] = []): Promise<ParsedItem[]> {
  try {
    const productsContext = existingProducts.length > 0 
      ? `Available Products in Shop (Name, ID, Price):\n${existingProducts.map(p => `- ${p.name} (id: ${p.id}, price: ${p.price})`).join('\n')}`
      : "No product list available.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a POS billing assistant for a grocery shop. 
      Parse the following Tamil speech about items into a structured list.
      
      ${productsContext}
      
      Rules:
      1. Map the spoken item to the most likely Product from the "Available Products" list above.
      2. If you find a match, use that product's name and price.
      3. If no match is found, just parse the name, quantity, and use 0 as price if not mentioned.
      
      Example input: "அரிசி 1 கிலோ 50 ரூபாய், முட்டை 5 30 ரூபாய்"
      Example output: [{"name": "அரிசி", "quantity": 1, "price": 50}]
      
      Input: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Product name in Tamil" },
              quantity: { type: Type.NUMBER, description: "Numeric quantity" },
              price: { type: Type.NUMBER, description: "Total price for this item" },
            },
            required: ["name", "quantity", "price"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return [];
  }
}
