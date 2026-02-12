import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback: simple regex-based extraction if no API key
      const tasks = extractTasksFallback(text);
      return NextResponse.json({ tasks });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Extract actionable tasks from the following progress update. Return ONLY a JSON array of task titles (strings). If there are no clear actionable tasks, return an empty array [].

Progress update: "${text}"

Rules:
- Each task should be a clear, actionable item
- Keep task titles concise (under 100 characters)
- Focus on TODO items, action items, or things that need to be done
- Don't include tasks that are already completed
- Return valid JSON array only, no other text

JSON array:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', await response.text());
      // Fallback to simple extraction
      const tasks = extractTasksFallback(text);
      return NextResponse.json({ tasks });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '[]';

    // Parse the response
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        if (Array.isArray(tasks)) {
          return NextResponse.json({ tasks: tasks.filter((t: unknown) => typeof t === 'string' && t.trim()) });
        }
      }
    } catch {
      console.error('Failed to parse AI response:', content);
    }

    // Fallback if parsing fails
    const tasks = extractTasksFallback(text);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error extracting tasks:', error);
    return NextResponse.json({ error: 'Failed to extract tasks' }, { status: 500 });
  }
}

// Simple fallback extraction without AI
function extractTasksFallback(text: string): string[] {
  const tasks: string[] = [];

  // Look for common task patterns
  const patterns = [
    /(?:need to|have to|should|must|todo:|to-do:|action:)\s*([^.!?\n]+)/gi,
    /(?:^|\n)\s*[-*•]\s*([^.!?\n]+)/g,
    /(?:^|\n)\s*\d+[.)]\s*([^.!?\n]+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const task = match[1]?.trim();
      if (task && task.length > 3 && task.length < 150 && !tasks.includes(task)) {
        tasks.push(task);
      }
    }
  }

  // If no patterns found, check if the text itself looks like a task list
  if (tasks.length === 0 && text.includes(',')) {
    const parts = text.split(',').map(p => p.trim()).filter(p => p.length > 3 && p.length < 100);
    if (parts.length >= 2) {
      return parts;
    }
  }

  return tasks;
}
