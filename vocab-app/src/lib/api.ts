import { DictionaryResponse } from '@/types';

const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const TRANSLATE_API = 'https://api.mymemory.translated.net/get';

export async function lookupWord(word: string) {
  try {
    const response = await fetch(`${DICT_API}/${encodeURIComponent(word)}`);
    if (!response.ok) {
      return null;
    }
    const data: DictionaryResponse[] = await response.json();
    return data[0];
  } catch (error) {
    console.error('Dictionary API error:', error);
    return null;
  }
}

export async function translateText(text: string): Promise<string> {
  try {
    const response = await fetch(
      `${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=en|zh`
    );
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error('Translation API error:', error);
    return '';
  }
}

export async function getWordWithTranslation(word: string) {
  const dictData = await lookupWord(word);
  if (!dictData) {
    return null;
  }

  const firstMeaning = dictData.meanings[0];
  const firstDefinition = firstMeaning?.definitions[0];

  if (!firstDefinition) {
    return null;
  }

  // 启动翻译但不等待 - 异步加载
  translateText(firstDefinition.definition).catch(() => {});

  // 查找例句：先从第一个定义找，没有就从同词性的其他定义找，还没有就从其他词性找
  let example = firstDefinition.example || '';

  if (!example) {
    // 在第一个词性的其他定义中查找
    for (const def of firstMeaning.definitions || []) {
      if (def.example) {
        example = def.example;
        break;
      }
    }
  }

  if (!example) {
    // 在其他词性中查找
    for (const meaning of dictData.meanings || []) {
      for (const def of meaning.definitions || []) {
        if (def.example) {
          example = def.example;
          break;
        }
      }
      if (example) break;
    }
  }

  return {
    word: dictData.word,
    phonetic: dictData.phonetic || dictData.phonetics?.[0]?.text || '',
    partOfSpeech: firstMeaning.partOfSpeech,
    definitionEn: firstDefinition.definition,
    definitionZh: '加载中...', // 占位符
    example,
    synonyms: firstMeaning.synonyms?.slice(0, 6) || [],
  };
}

// 单独的翻译函数，用于异步获取中文
export async function getChineseTranslation(englishText: string): Promise<string> {
  return await translateText(englishText);
}
