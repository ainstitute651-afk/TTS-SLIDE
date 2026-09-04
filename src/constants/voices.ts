export interface VoiceDefinition {
  id: string; // e.g. 'en-US-GuyNeural'
  name: string; // e.g. 'Guy (Neural)'
  lang: string; // e.g. 'en-US'
  languageName: string; // e.g. 'English (United States)'
  gender: 'Male' | 'Female';
}

export const EDGE_VOICES: VoiceDefinition[] = [
  // English (US)
  { id: 'en-US-GuyNeural', name: 'Guy (Natural, Confident)', lang: 'en-US', languageName: 'English (US)', gender: 'Male' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Natural, Friendly)', lang: 'en-US', languageName: 'English (US)', gender: 'Female' },
  { id: 'en-US-AriaNeural', name: 'Aria (Warm, Expressive)', lang: 'en-US', languageName: 'English (US)', gender: 'Female' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (Authoritative)', lang: 'en-US', languageName: 'English (US)', gender: 'Male' },
  { id: 'en-US-EricNeural', name: 'Eric (Casual, Dynamic)', lang: 'en-US', languageName: 'English (US)', gender: 'Male' },
  { id: 'en-US-MichelleNeural', name: 'Michelle (Professional)', lang: 'en-US', languageName: 'English (US)', gender: 'Female' },
  { id: 'en-US-RogerNeural', name: 'Roger (Clear, Narrative)', lang: 'en-US', languageName: 'English (US)', gender: 'Male' },
  { id: 'en-US-AnaNeural', name: 'Ana (Youthful, Engaging)', lang: 'en-US', languageName: 'English (US)', gender: 'Female' },

  // English (UK)
  { id: 'en-GB-SoniaNeural', name: 'Sonia (British, Elegant)', lang: 'en-GB', languageName: 'English (UK)', gender: 'Female' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (British, Clear)', lang: 'en-GB', languageName: 'English (UK)', gender: 'Male' },
  { id: 'en-GB-LibbyNeural', name: 'Libby (British, Pleasant)', lang: 'en-GB', languageName: 'English (UK)', gender: 'Female' },
  { id: 'en-GB-ThomasNeural', name: 'Thomas (British, Polite)', lang: 'en-GB', languageName: 'English (UK)', gender: 'Male' },

  // English (Australia & Canada & India)
  { id: 'en-AU-NatashaNeural', name: 'Natasha (Australian)', lang: 'en-AU', languageName: 'English (Australia)', gender: 'Female' },
  { id: 'en-AU-WilliamNeural', name: 'William (Australian)', lang: 'en-AU', languageName: 'English (Australia)', gender: 'Male' },
  { id: 'en-CA-ClaraNeural', name: 'Clara (Canadian)', lang: 'en-CA', languageName: 'English (Canada)', gender: 'Female' },
  { id: 'en-CA-LiamNeural', name: 'Liam (Canadian)', lang: 'en-CA', languageName: 'English (Canada)', gender: 'Male' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian English)', lang: 'en-IN', languageName: 'English (India)', gender: 'Female' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat (Indian English)', lang: 'en-IN', languageName: 'English (India)', gender: 'Male' },

  // Spanish (Spain & Mexico)
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro (Castilian)', lang: 'es-ES', languageName: 'Spanish (Spain)', gender: 'Male' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira (Castilian)', lang: 'es-ES', languageName: 'Spanish (Spain)', gender: 'Female' },
  { id: 'es-MX-DaliaNeural', name: 'Dalia (Mexican)', lang: 'es-MX', languageName: 'Spanish (Mexico)', gender: 'Female' },
  { id: 'es-MX-JorgeNeural', name: 'Jorge (Mexican)', lang: 'es-MX', languageName: 'Spanish (Mexico)', gender: 'Male' },

  // French
  { id: 'fr-FR-HenriNeural', name: 'Henri (French)', lang: 'fr-FR', languageName: 'French (France)', gender: 'Male' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (French)', lang: 'fr-FR', languageName: 'French (France)', gender: 'Female' },
  { id: 'fr-CA-SylvieNeural', name: 'Sylvie (Canadian French)', lang: 'fr-CA', languageName: 'French (Canada)', gender: 'Female' },

  // German
  { id: 'de-DE-ConradNeural', name: 'Conrad (German)', lang: 'de-DE', languageName: 'German (Germany)', gender: 'Male' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (German)', lang: 'de-DE', languageName: 'German (Germany)', gender: 'Female' },
  { id: 'de-DE-KillianNeural', name: 'Killian (German)', lang: 'de-DE', languageName: 'German (Germany)', gender: 'Male' },

  // Italian
  { id: 'it-IT-DiegoNeural', name: 'Diego (Italian)', lang: 'it-IT', languageName: 'Italian (Italy)', gender: 'Male' },
  { id: 'it-IT-ElsaNeural', name: 'Elsa (Italian)', lang: 'it-IT', languageName: 'Italian (Italy)', gender: 'Female' },

  // Portuguese (Brazil & Portugal)
  { id: 'pt-BR-AntonioNeural', name: 'Antônio (Brazilian)', lang: 'pt-BR', languageName: 'Portuguese (Brazil)', gender: 'Male' },
  { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Brazilian)', lang: 'pt-BR', languageName: 'Portuguese (Brazil)', gender: 'Female' },
  { id: 'pt-PT-RaquelNeural', name: 'Raquel (European)', lang: 'pt-PT', languageName: 'Portuguese (Portugal)', gender: 'Female' },

  // Japanese
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (Japanese)', lang: 'ja-JP', languageName: 'Japanese (Japan)', gender: 'Female' },
  { id: 'ja-JP-KeitaNeural', name: 'Keita (Japanese)', lang: 'ja-JP', languageName: 'Japanese (Japan)', gender: 'Male' },

  // Chinese (Mandarin & Cantonese)
  { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (Mandarin)', lang: 'zh-CN', languageName: 'Chinese (Simplified)', gender: 'Female' },
  { id: 'zh-CN-YunxiNeural', name: 'Yunxi (Mandarin)', lang: 'zh-CN', languageName: 'Chinese (Simplified)', gender: 'Male' },
  { id: 'zh-HK-HiuMaanNeural', name: 'HiuMaan (Cantonese)', lang: 'zh-HK', languageName: 'Chinese (Hong Kong)', gender: 'Female' },

  // Korean
  { id: 'ko-KR-SunHiNeural', name: 'Sun-Hi (Korean)', lang: 'ko-KR', languageName: 'Korean (South Korea)', gender: 'Female' },
  { id: 'ko-KR-InJoonNeural', name: 'InJoon (Korean)', lang: 'ko-KR', languageName: 'Korean (South Korea)', gender: 'Male' },

  // Hindi
  { id: 'hi-IN-SwaraNeural', name: 'Swara (Hindi)', lang: 'hi-IN', languageName: 'Hindi (India)', gender: 'Female' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur (Hindi)', lang: 'hi-IN', languageName: 'Hindi (India)', gender: 'Male' },

  // Dutch, Swedish, Polish, Russian, Turkish, Arabic
  { id: 'nl-NL-ColetteNeural', name: 'Colette (Dutch)', lang: 'nl-NL', languageName: 'Dutch (Netherlands)', gender: 'Female' },
  { id: 'nl-NL-MaartenNeural', name: 'Maarten (Dutch)', lang: 'nl-NL', languageName: 'Dutch (Netherlands)', gender: 'Male' },
  { id: 'sv-SE-SofieNeural', name: 'Sofie (Swedish)', lang: 'sv-SE', languageName: 'Swedish (Sweden)', gender: 'Female' },
  { id: 'pl-PL-MarekNeural', name: 'Marek (Polish)', lang: 'pl-PL', languageName: 'Polish (Poland)', gender: 'Male' },
  { id: 'pl-PL-ZofiaNeural', name: 'Zofia (Polish)', lang: 'pl-PL', languageName: 'Polish (Poland)', gender: 'Female' },
  { id: 'ru-RU-DmitryNeural', name: 'Dmitry (Russian)', lang: 'ru-RU', languageName: 'Russian (Russia)', gender: 'Male' },
  { id: 'ru-RU-SvetlanaNeural', name: 'Svetlana (Russian)', lang: 'ru-RU', languageName: 'Russian (Russia)', gender: 'Female' },
  { id: 'tr-TR-AhmetNeural', name: 'Ahmet (Turkish)', lang: 'tr-TR', languageName: 'Turkish (Turkey)', gender: 'Male' },
  { id: 'ar-SA-HamedNeural', name: 'Hamed (Arabic)', lang: 'ar-SA', languageName: 'Arabic (Saudi Arabia)', gender: 'Male' },
  { id: 'ar-SA-ZariyahNeural', name: 'Zariyah (Arabic)', lang: 'ar-SA', languageName: 'Arabic (Saudi Arabia)', gender: 'Female' },
];

export const DEFAULT_VOICE_ID = 'en-US-GuyNeural';
export const DEFAULT_VOICE = EDGE_VOICES[0];
