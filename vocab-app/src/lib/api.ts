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

  // Translate definition to Chinese
  const definitionZh = await translateText(firstDefinition.definition);

  return {
    word: dictData.word,
    phonetic: dictData.phonetic || dictData.phonetics?.[0]?.text || '',
    partOfSpeech: firstMeaning.partOfSpeech,
    definitionEn: firstDefinition.definition,
    definitionZh,
    example: firstDefinition.example || '',
    synonyms: firstMeaning.synonyms?.slice(0, 6) || [],
  };
}
