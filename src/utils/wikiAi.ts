import { CategoryType } from '../../types';
import { GoogleGenAI } from '@google/genai';

export interface WikiContext {
  title: string;
  summary: string;
  url: string;
}

export interface DescriptionResult {
  description: string;
  source: 'wikipedia' | 'fallback';
  wiki?: WikiContext;
}

const wikiCache = new Map<string, WikiContext | null>();

const normalizeText = (text: string, maxLength: number) => {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

export const getWikipediaSummary = async (query: string): Promise<WikiContext | null> => {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (wikiCache.has(key)) return wikiCache.get(key) || null;

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      wikiCache.set(key, null);
      return null;
    }

    const searchData = await searchRes.json();
    const title = Array.isArray(searchData?.[1]) ? searchData[1][0] : null;
    if (!title) {
      wikiCache.set(key, null);
      return null;
    }

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) {
      wikiCache.set(key, null);
      return null;
    }

    const summaryData = await summaryRes.json();
    const summary = normalizeText(summaryData?.extract || '', 700);
    if (!summary) {
      wikiCache.set(key, null);
      return null;
    }

    const context: WikiContext = {
      title,
      summary,
      url: summaryData?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
    };

    wikiCache.set(key, context);
    return context;
  } catch {
    wikiCache.set(key, null);
    return null;
  }
};

export const generateWikiFirstDescription = async ({
  name,
  category,
  apiKey
}: {
  name: string;
  category: CategoryType | string;
  apiKey?: string;
}): Promise<DescriptionResult> => {
  const wiki = await getWikipediaSummary(name);
  const wikiSource = wiki ? 'wikipedia' : 'fallback';

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    if (wiki) {
      return {
        description: normalizeText(`${wiki.summary} Digital format release for ${category}.`, 170),
        source: wikiSource,
        wiki
      };
    }

    return {
      description: normalizeText(`Premium ${category} digital resource focused on ${name}.`, 120),
      source: 'fallback'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const wikiPrompt = wiki
      ? `Use this Wikipedia context first:\nTitle: ${wiki.title}\nSummary: ${wiki.summary}\nSource: ${wiki.url}`
      : 'No reliable Wikipedia match found. Use product name and category only.';

    const prompt = [
      'Write one concise marketplace description in plain English.',
      'Rules: 12 to 18 words, no hype, no claims of ownership, no markdown.',
      `Product name: ${name}`,
      `Category: ${category}`,
      wikiPrompt
    ].join('\n');

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const text = normalizeText(result.text || '', 170);
    if (text) {
      return {
        description: text,
        source: wikiSource,
        wiki
      };
    }
  } catch {
    // Fall through to deterministic fallback
  }

  if (wiki) {
    return {
      description: normalizeText(`${wiki.summary} Digital format release for ${category}.`, 170),
      source: 'wikipedia',
      wiki
    };
  }

  return {
    description: normalizeText(`Premium ${category} digital resource focused on ${name}.`, 120),
    source: 'fallback'
  };
};
