import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnhanceDescriptionDto } from './dto/enhance-description.dto';

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async enhanceDescription(input: EnhanceDescriptionDto) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');

    if (!apiKey) {
      throw new InternalServerErrorException('Gemini API key is missing');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = [
      'You are a professional event copywriter.',
      'Improve the provided event description to be clearer, more engaging, and concise.',
      'Keep factual details unchanged. Return only the enhanced description text.',
      `Event name: ${input.eventName ?? 'Untitled Event'}`,
      `Event type: ${input.eventType ?? 'Event'}`,
      'Original description:',
      input.description,
    ].join('\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`Gemini request failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const enhanced =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim() || input.description;

    return { enhanced };
  }
}
