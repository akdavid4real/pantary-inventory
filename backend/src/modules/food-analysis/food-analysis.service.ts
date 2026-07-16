import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { EnvironmentService } from '../../common/config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyzeFoodPhotoDto } from './dto/food-analysis.dto';

type FoodAnalysis = {
  isFood: boolean;
  dishName: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  likelyIngredients: string[];
  servingDescription: string;
  estimatedNutrition: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  allergenWarnings: string[];
  observations: string[];
  answer: string;
};

@Injectable()
export class FoodAnalysisService {
  private readonly logger = new Logger(FoodAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: EnvironmentService,
  ) {}

  async analyze(userId: string, dto: AnalyzeFoodPhotoDto) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Gemini food analysis is not configured yet. Add GEMINI_API_KEY to the backend environment.',
      );
    }

    const imageData = dto.base64.replace(/^data:[^;]+;base64,/, '');
    const bytes = Buffer.from(imageData, 'base64');
    if (!bytes.length || bytes.length > 2_500_000) {
      throw new BadRequestException('Food photos must be smaller than 2.5 MB after compression.');
    }
    if (!this.matchesFileSignature(bytes, dto.contentType)) {
      throw new BadRequestException('The uploaded data does not match the selected image type.');
    }

    const preferences = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { allergies: true, avoidedIngredients: true, dietaryPreference: true },
    });
    const model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    let analysis: FoodAnalysis;
    try {
      analysis = await this.analyzeWithGemini({
        apiKey,
        model,
        imageData,
        contentType: dto.contentType,
        question: dto.question,
        preferences,
      });
    } catch (error) {
      this.logger.warn(`Gemini food analysis failed: ${error instanceof Error ? error.message : 'Unknown API error'}`);
      throw new ServiceUnavailableException('Gemini could not analyze this photo right now. Please try again.');
    }

    return {
      ...this.normalizeAnalysis(analysis),
      model,
      disclaimer: 'Photo-based food and nutrition results are estimates. Portions, ingredients, and preparation methods can change the actual values.',
    };
  }

  private async analyzeWithGemini(input: {
    apiKey: string;
    model: string;
    imageData: string;
    contentType: string;
    question?: string;
    preferences: { allergies: string[]; avoidedIngredients: string[]; dietaryPreference: string | null } | null;
  }) {
    const client = new GoogleGenAI({ apiKey: input.apiKey, httpOptions: { timeout: 20_000 } });
    const response = await client.interactions.create({
      model: input.model,
      store: false,
      system_instruction: [
        'You are the Nigerian-aware food photo analyst for Pantry-to-Plate.',
        'Identify only what is visually supported and lower confidence when uncertain.',
        'Nutrition values must be cautious estimates for the visible serving, never medical advice.',
        'Mention possible allergens and clearly answer the user question.',
        'If the image is not food, set isFood to false and explain that briefly.',
      ].join(' '),
      input: [
        { type: 'image', mime_type: input.contentType, data: input.imageData },
        {
          type: 'text',
          text: JSON.stringify({
            task: 'Analyze this food photo.',
            userQuestion: input.question || 'What food is this, what may be in it, and what is the estimated nutrition?',
            savedFoodProfile: input.preferences,
          }),
        },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            isFood: { type: 'boolean' },
            dishName: { type: 'string' },
            confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            description: { type: 'string' },
            likelyIngredients: { type: 'array', items: { type: 'string' }, maxItems: 20 },
            servingDescription: { type: 'string' },
            estimatedNutrition: {
              type: 'object',
              properties: {
                calories: { type: 'number', minimum: 0, maximum: 5000 },
                proteinGrams: { type: 'number', minimum: 0, maximum: 500 },
                carbsGrams: { type: 'number', minimum: 0, maximum: 1000 },
                fatGrams: { type: 'number', minimum: 0, maximum: 500 },
              },
              required: ['calories', 'proteinGrams', 'carbsGrams', 'fatGrams'],
              additionalProperties: false,
            },
            allergenWarnings: { type: 'array', items: { type: 'string' }, maxItems: 10 },
            observations: { type: 'array', items: { type: 'string' }, maxItems: 10 },
            answer: { type: 'string' },
          },
          required: [
            'isFood', 'dishName', 'confidence', 'description', 'likelyIngredients',
            'servingDescription', 'estimatedNutrition', 'allergenWarnings', 'observations', 'answer',
          ],
          additionalProperties: false,
        },
      },
    });
    if (!response.output_text) throw new ServiceUnavailableException('Gemini could not analyze this photo.');
    return JSON.parse(response.output_text) as FoodAnalysis;
  }

  private normalizeAnalysis(value: FoodAnalysis): FoodAnalysis {
    const confidence = ['LOW', 'MEDIUM', 'HIGH'].includes(value.confidence) ? value.confidence : 'LOW';
    return {
      isFood: Boolean(value.isFood),
      dishName: String(value.dishName || 'Unidentified food').slice(0, 120),
      confidence: confidence as FoodAnalysis['confidence'],
      description: String(value.description || '').slice(0, 600),
      likelyIngredients: this.stringList(value.likelyIngredients, 20),
      servingDescription: String(value.servingDescription || 'Visible serving').slice(0, 180),
      estimatedNutrition: {
        calories: this.safeNumber(value.estimatedNutrition?.calories, 5000),
        proteinGrams: this.safeNumber(value.estimatedNutrition?.proteinGrams, 500),
        carbsGrams: this.safeNumber(value.estimatedNutrition?.carbsGrams, 1000),
        fatGrams: this.safeNumber(value.estimatedNutrition?.fatGrams, 500),
      },
      allergenWarnings: this.stringList(value.allergenWarnings, 10),
      observations: this.stringList(value.observations, 10),
      answer: String(value.answer || '').slice(0, 1200),
    };
  }

  private stringList(value: unknown, limit: number) {
    return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean).slice(0, limit) : [];
  }

  private safeNumber(value: unknown, maximum: number) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(0, Math.round(number * 10) / 10)) : 0;
  }

  private matchesFileSignature(bytes: Buffer, contentType: AnalyzeFoodPhotoDto['contentType']) {
    if (contentType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (contentType === 'image/png') {
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  }
}
