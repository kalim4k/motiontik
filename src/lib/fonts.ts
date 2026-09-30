import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

type GoogleFontInfo = {
  fontFamily: string;
  importName: string;
  unicodeRanges: Record<string, string>;
};

/**
 * Charge une police Google depuis public/fonts/ (téléchargée par `npm run fonts`)
 * au lieu de fonts.gstatic.com : le rendu marche hors ligne.
 * `getInfo` vient de @remotion/google-fonts/<Police> (métadonnées seulement, pas de réseau).
 */
export const loadLocalFont = (
  getInfo: () => GoogleFontInfo,
  { weights, subsets }: { weights: string[]; subsets: string[] },
) => {
  const info = getInfo();
  if (typeof FontFace !== "undefined") {
    for (const weight of weights) {
      for (const subset of subsets) {
        const handle = delayRender(`Police ${info.fontFamily} ${weight} ${subset}`);
        const face = new FontFace(
          info.fontFamily,
          `url(${staticFile(`fonts/${info.importName}-${weight}-${subset}.woff2`)}) format("woff2")`,
          { weight, style: "normal", unicodeRange: info.unicodeRanges[subset] },
        );
        face
          .load()
          .then(() => {
            document.fonts.add(face);
            continueRender(handle);
          })
          .catch((err) =>
            cancelRender(new Error(`${info.fontFamily} ${weight} ${subset} : ${err} (lancer npm run fonts)`)),
          );
      }
    }
  }
  return { fontFamily: info.fontFamily };
};
