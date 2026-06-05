import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../translations/translations';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('tr');

  useEffect(() => {
    AsyncStorage.getItem('appLanguage').then((saved) => {
      if (saved === 'en' || saved === 'tr') setLanguage(saved as Language);
    });
  }, []);

  const changeLanguage = (lang: Language) => {
    AsyncStorage.setItem('appLanguage', lang).then(() => setLanguage(lang));
  };

  return { language, strings: translations[language], changeLanguage };
};
