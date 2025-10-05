import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. AI features will not work.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
})

export async function analyzeDocument(text: string, fileName: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a legal document analyzer for Croatian law firms. Analyze the following document and provide:
1. A concise summary (2-3 sentences)
2. Key entities (names, dates, amounts, locations)
3. Important clauses or sections
4. Risk assessment (0-100 score with explanation)
5. Document type classification

Return your response in JSON format.`,
        },
        {
          role: 'user',
          content: `Document: ${fileName}\n\nContent:\n${text.slice(0, 15000)}`, // Limit to ~15k chars
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Error analyzing document:', error)
    throw error
  }
}

export async function summarizeDocument(text: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a legal document summarizer. Provide a clear, concise summary in Croatian.',
        },
        {
          role: 'user',
          content: `Summarize this document:\n\n${text.slice(0, 10000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error summarizing document:', error)
    throw error
  }
}
