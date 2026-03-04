const Anthropic = require('@anthropic-ai/sdk').default;
const { getSystemPrompt } = require('../prompts/system-prompt');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function chatStream(userMessage, conversationHistory = [], res) {
  const recentHistory = conversationHistory.slice(-20);

  const messages = [
    ...recentHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: getSystemPrompt(),
      messages
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write('data: ' + JSON.stringify({ text: event.delta.text }) + '\n\n');
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Claude API authentication failed:', error.message);
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error('Claude API rate limited:', error.message);
    } else if (error instanceof Anthropic.BadRequestError) {
      console.error('Claude API bad request:', error.message);
    } else {
      console.error('Claude API error:', error.message || error);
    }

    res.write('data: ' + JSON.stringify({ error: 'Unable to reach our assistant. Please call 210-353-2222.' }) + '\n\n');
    res.end();
  }
}

module.exports = { chatStream };
