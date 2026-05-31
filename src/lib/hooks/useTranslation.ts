import { useCallback } from "react";
import { useLanguageStore, type Locale } from "../stores/languageStore";

type TranslationParams = Record<string, string | number>;

export function useTranslation() {
  const { messages, locale, setLocale } = useLanguageStore();

  const t = useCallback(
    (path: string, params?: TranslationParams): string => {
      // Since the store is initialized on the server and client with the same language
      // using LanguageInitializer, we can use the store messages directly!
      const activeMessages = messages;
      
      // 1. Resolve path (e.g., "home.chat.initialGreeting")
      const keys = path.split(".");
      let resolved: any = activeMessages;

      for (const key of keys) {
        if (resolved && typeof resolved === "object" && key in resolved) {
          resolved = resolved[key];
        } else {
          // Path not found, return the path as fallback
          return path;
        }
      }

      if (typeof resolved !== "string") {
        return path;
      }

      let result = resolved;

      // 2. ICU Pluralization Parsing: {count, plural, =0 {zero} =1 {one} other {many}}
      let searchOffset = 0;
      while (true) {
        let pluralIdx = result.indexOf("plural,", searchOffset);
        if (pluralIdx === -1) {
          pluralIdx = result.indexOf("plural ,", searchOffset);
        }
        if (pluralIdx === -1) break;

        let startIdx = -1;
        for (let j = pluralIdx - 1; j >= 0; j--) {
          if (result[j] === "{") {
            startIdx = j;
            break;
          }
        }
        if (startIdx === -1) {
          searchOffset = pluralIdx + 1;
          continue;
        }

        let braceCount = 1;
        let endIdx = -1;
        for (let j = startIdx + 1; j < result.length; j++) {
          if (result[j] === "{") braceCount++;
          else if (result[j] === "}") braceCount--;
          if (braceCount === 0) {
            endIdx = j;
            break;
          }
        }
        if (endIdx === -1) {
          searchOffset = pluralIdx + 1;
          continue;
        }

        const fullMatch = result.slice(startIdx, endIdx + 1);
        const inside = result.slice(startIdx + 1, endIdx);
        const comma1 = inside.indexOf(",");
        if (comma1 === -1) {
          searchOffset = endIdx + 1;
          continue;
        }

        const varName = inside.slice(0, comma1).trim();
        const afterVar = inside.slice(comma1 + 1);
        const comma2 = afterVar.indexOf(",");
        if (comma2 === -1) {
          searchOffset = endIdx + 1;
          continue;
        }

        const pluralOptionsStr = afterVar.slice(comma2 + 1);

        const count = Number(params?.[varName] ?? 0);

        // Parse options using balanced braces
        const options: Record<string, string> = {};
        let i = 0;
        let parsingFailed = false;

        while (i < pluralOptionsStr.length) {
          while (i < pluralOptionsStr.length && /\s/.test(pluralOptionsStr[i])) i++;
          if (i >= pluralOptionsStr.length) break;

          let keyStart = i;
          while (i < pluralOptionsStr.length && !/\s/.test(pluralOptionsStr[i]) && pluralOptionsStr[i] !== "{") i++;
          const key = pluralOptionsStr.slice(keyStart, i).trim();

          while (i < pluralOptionsStr.length && pluralOptionsStr[i] !== "{") i++;
          if (i >= pluralOptionsStr.length) {
            parsingFailed = true;
            break;
          }
          i++;

          let valStart = i;
          let innerBrace = 1;
          while (i < pluralOptionsStr.length && innerBrace > 0) {
            if (pluralOptionsStr[i] === "{") innerBrace++;
            else if (pluralOptionsStr[i] === "}") innerBrace--;
            i++;
          }
          
          if (innerBrace > 0) {
            parsingFailed = true;
            break;
          }

          const val = pluralOptionsStr.slice(valStart, i - 1);
          options[key] = val;
        }

        if (parsingFailed) {
          searchOffset = endIdx + 1;
          continue;
        }

        const exactKey = `=${count}`;
        let selectedValue = "";
        if (exactKey in options) {
          selectedValue = options[exactKey];
        } else if (count === 1 && "=1" in options) {
          selectedValue = options["=1"];
        } else {
          selectedValue = options["other"] ?? fullMatch;
        }

        if (selectedValue === fullMatch) {
          searchOffset = endIdx + 1;
          continue;
        }

        result = result.slice(0, startIdx) + selectedValue + result.slice(endIdx + 1);
        // Do not update searchOffset since we replaced the string
      }

      // 3. General Parameter Replacement: {placeholder}
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          result = result.replaceAll(`{${key}}`, String(value));
        });
      }

      return result;
    },
    [messages]
  );

  return {
    t,
    locale,
    setLocale,
  };
}

