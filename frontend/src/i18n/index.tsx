import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import zh from "./zh"
import en from "./en"

const savedLocale = localStorage.getItem("locale") || "zh"

i18n.use(initReactI18next).init({
  resources: { zh, en },
  lng: savedLocale,
  fallbackLng: "zh",
  interpolation: {
    escapeValue: false,
  },
})

// Sync lang attribute
document.documentElement.lang = savedLocale
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("locale", lng)
  document.documentElement.lang = lng
})

export default i18n
