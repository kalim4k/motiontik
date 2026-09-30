import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./lib/theme";
import { loadTiming, type VideoProps } from "./lib/timing";
import { Demo } from "./videos/demo";
import { GuideChariow } from "./videos/guide-chariow";
import { JEU_ADSENSE_GAP, JeuAdsense } from "./videos/jeu-adsense";
import { JEUX_IA_GAP, JeuxIA } from "./videos/jeux-ia";
import { Business500F } from "./videos/business-500f";
import { FailleChatGPT } from "./videos/faille-chatgpt";
import { PersoTest } from "./videos/perso-test";
import { StickLab } from "./videos/stick-lab";
import { ArnaqueLegale } from "./videos/arnaque-legale";
import { JeuGratuit } from "./videos/jeu-gratuit";
import { Flappy, FlappyClip } from "./videos/flappy";
import { DiscussionJeu } from "./videos/discussion-jeu";

// Une entrée par vidéo : slug (= dossier dans videos/ et public/) + composant
// `extra` = secondes ajoutées à la durée de la voix (pauses insérées).
const videos: { slug: string; component: React.FC<VideoProps>; extra?: number }[] = [
  { slug: "demo", component: Demo },
  { slug: "jeu-adsense", component: JeuAdsense, extra: JEU_ADSENSE_GAP },
  { slug: "guide-chariow", component: GuideChariow },
  { slug: "jeux-ia", component: JeuxIA, extra: JEUX_IA_GAP },
  { slug: "perso-test", component: PersoTest },
  { slug: "faille-chatgpt", component: FailleChatGPT },
  { slug: "business-500f", component: Business500F },
  { slug: "arnaque-legale", component: ArnaqueLegale },
  { slug: "jeu-gratuit", component: JeuGratuit },
  { slug: "flappy", component: Flappy },
  { slug: "discussion-jeu", component: DiscussionJeu },
];

export const Root: React.FC = () => (
  <>
    {videos.map(({ slug, component, extra = 0 }) => (
      <Composition
        key={slug}
        id={slug}
        component={component}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={FPS * 10}
        defaultProps={{ slug, timing: null } as VideoProps}
        calculateMetadata={async ({ props }) => {
          const timing = await loadTiming(props.slug);
          return {
            durationInFrames: Math.ceil((timing.duration + 1 + extra) * FPS),
            props: { ...props, timing },
          };
        }}
      />
    ))}
    {/* Clip du mini-jeu, rendu en public/flappy/clip.mp4 (aperçu dans la fenêtre Claude) */}
    <Composition id="flappy-clip" component={FlappyClip} width={400} height={820} fps={FPS} durationInFrames={FPS * 8} />
    <Composition id="stick-lab" component={StickLab} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={4} />
  </>
);
