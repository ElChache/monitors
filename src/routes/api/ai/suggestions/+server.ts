import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt, context } = await request.json();
    
    // Mock AI suggestions for development
    // In production, this would connect to actual AI service
    const suggestions = generateMockSuggestions(prompt);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    return json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
};

interface AISuggestion {
  id: string;
  type: 'improvement' | 'clarity' | 'specificity' | 'alternative';
  title: string;
  description: string;
  suggested_text: string;
  confidence: number;
  reasoning: string;
}

function generateMockSuggestions(text: string): AISuggestion[] {
  const mockSuggestions: AISuggestion[] = [];
  const lowerText = text.toLowerCase();
  
  // Specificity suggestions
  if (!lowerText.includes('when') && !lowerText.includes('if')) {
    mockSuggestions.push({
      id: 'spec_1',
      type: 'specificity',
      title: 'Add trigger condition',
      description: 'Consider adding a specific condition to trigger your monitor',
      suggested_text: `${text} when [condition is met]`,
      confidence: 0.85,
      reasoning: 'Monitors work better with specific trigger conditions'
    });
  }
  
  // Stock monitoring improvements
  if (lowerText.includes('stock') || lowerText.includes('price') || lowerText.includes('$')) {
    mockSuggestions.push({
      id: 'stock_1',
      type: 'improvement',
      title: 'Specify price threshold',
      description: 'Add a specific price point for better monitoring accuracy',
      suggested_text: text.includes('$') ? text : `${text} below $[amount]`,
      confidence: 0.92,
      reasoning: 'Stock monitors need specific price thresholds for accurate alerts'
    });
  }
  
  // Weather suggestions
  if (lowerText.includes('weather') || lowerText.includes('rain') || lowerText.includes('snow')) {
    mockSuggestions.push({
      id: 'weather_1',
      type: 'clarity',
      title: 'Add location',
      description: 'Weather monitors work better with specific locations',
      suggested_text: lowerText.includes(' in ') ? text : `${text} in [city name]`,
      confidence: 0.88,
      reasoning: 'Weather data requires location specificity for accurate forecasts'
    });
  }
  
  // General clarity improvements
  if (text.length > 100) {
    mockSuggestions.push({
      id: 'clarity_1',
      type: 'clarity',
      title: 'Simplify description',
      description: 'Consider breaking this into multiple monitors for better accuracy',
      suggested_text: text.split('.')[0] || text.substring(0, 80) + '...',
      confidence: 0.75,
      reasoning: 'Simpler prompts often yield more accurate monitoring results'
    });
  }
  
  return mockSuggestions.slice(0, 3); // Limit to 3 suggestions max
}