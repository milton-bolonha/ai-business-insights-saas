import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  console.log("Registering fonts with origin:", origin);

  try {
    Font.register({
      family: "Montserrat",
      fonts: [
        { src: `${origin}/fonts/Montserrat-Regular.ttf`, fontWeight: 400 },
        { src: `${origin}/fonts/Montserrat-Bold.ttf`, fontWeight: 700 },
      ],
    });

    Font.register({
      family: "Oswald Bold",
      fonts: [{ src: `${origin}/fonts/Oswald-Bold.otf`, fontWeight: 700 }],
    });

    Font.register({
      family: "Palatino",
      fonts: [{ src: `${origin}/fonts/Palatino.ttf`, fontWeight: 400 }],
    });

    // We can try re-enabling hyphenation but with anoop if it was causing loops
    // Font.registerHyphenationCallback((word) => [word]); 
  } catch (err) {
    console.error("Font registration error:", err);
  }

  fontsRegistered = true;
}
