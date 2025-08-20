import "intl-pluralrules";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// https://docs.expo.dev/versions/latest/sdk/localization/#uselocales

const resources = {
  en: { translation: require("./locales/en.json") },
  es: { translation: require("./locales/es.json") },
  zh: { translation: require("./locales/zh.json") },
  ar: { translation: require("./locales/ar.json") },
};

export const detectLanguage = () => {
  try {
    return Localization.getLocales()[0]?.languageCode || "en";
  } catch {
    return "en";
  }
};

export const initializeI18n = async () => {
  const language = detectLanguage();

  // eslint-disable-next-line import/no-named-as-default-member
  await i18n.use(initReactI18next).init({
    lng: language,
    fallbackLng: "en",
    resources,
    ns: ["translation"],
    defaultNS: "translation",
    debug: false,
    interpolation: { escapeValue: false },
  });
};

export default i18n;

// example of a locale object
// [{
//     "languageTag": "pl-PL",
//     "languageCode": "pl",
//     "textDirection": "ltr",
//     "digitGroupingSeparator": " ",
//     "decimalSeparator": ",",
//     "measurementSystem": "metric",
//     "currencyCode": "PLN",
//     "currencySymbol": "zł",
//     "regionCode": "PL",
//     "temperatureUnit": "celsius"
//   }]

// example of a calendar object
// [{
//     "calendar": "gregory",
//     "timeZone": "Europe/Warsaw",
//     "uses24hourClock": true,
//     "firstWeekday": 1
//   }]
