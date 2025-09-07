import { json } from "@sveltejs/kit";
const POST = async ({ request }) => {
  try {
    const { prompt, context } = await request.json();
    const suggestions = generateMockSuggestions(prompt);
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
    return json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error("AI suggestions error:", error);
    return json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
};
function generateMockSuggestions(text) {
  const mockSuggestions = [];
  const lowerText = text.toLowerCase();
  if (!lowerText.includes("when") && !lowerText.includes("if")) {
    mockSuggestions.push({
      id: "spec_1",
      type: "specificity",
      title: "Add trigger condition",
      description: "Consider adding a specific condition to trigger your monitor",
      suggested_text: `${text} when [condition is met]`,
      confidence: 0.85,
      reasoning: "Monitors work better with specific trigger conditions"
    });
  }
  if (lowerText.includes("stock") || lowerText.includes("price") || lowerText.includes("$")) {
    mockSuggestions.push({
      id: "stock_1",
      type: "improvement",
      title: "Specify price threshold",
      description: "Add a specific price point for better monitoring accuracy",
      suggested_text: text.includes("$") ? text : `${text} below $[amount]`,
      confidence: 0.92,
      reasoning: "Stock monitors need specific price thresholds for accurate alerts"
    });
  }
  if (lowerText.includes("weather") || lowerText.includes("rain") || lowerText.includes("snow")) {
    mockSuggestions.push({
      id: "weather_1",
      type: "clarity",
      title: "Add location",
      description: "Weather monitors work better with specific locations",
      suggested_text: lowerText.includes(" in ") ? text : `${text} in [city name]`,
      confidence: 0.88,
      reasoning: "Weather data requires location specificity for accurate forecasts"
    });
  }
  if (text.length > 100) {
    mockSuggestions.push({
      id: "clarity_1",
      type: "clarity",
      title: "Simplify description",
      description: "Consider breaking this into multiple monitors for better accuracy",
      suggested_text: text.split(".")[0] || text.substring(0, 80) + "...",
      confidence: 0.75,
      reasoning: "Simpler prompts often yield more accurate monitoring results"
    });
  }
  return mockSuggestions.slice(0, 3);
}
export {
  POST
};
