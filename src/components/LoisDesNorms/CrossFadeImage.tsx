import { useEffect, useRef, useState } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { REDUCED } from "./motion";
import { motion } from "./tokens";

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

interface Props {
  url: string;
  /** Position and fit of the image layers. */
  imgSx: SxProps<Theme>;
}

interface Shown {
  /** The url whose image is decoded and showing. */
  current?: string;
  /** The one it replaced, fading out on top of it. */
  previous?: string;
}

/**
 * An image that shows a new url once it is decoded and fades the previous one
 * out on top of it. Readiness comes from the element itself (decode(), which
 * also resolves for an image already in cache) as well as onLoad, which can be
 * missed for cached images. Until the first image is ready, or if it fails,
 * nothing shows, so whatever lies underneath stays visible.
 */
const CrossFadeImage = ({ url, imgSx }: Props) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [shown, setShown] = useState<Shown>({});
  const [failed, setFailed] = useState<string | undefined>(undefined);

  const showUpdate = (s: Shown): Shown => (s.current === url ? s : { current: url, previous: s.current });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return () => undefined;
    let cancelled = false;
    img.decode().then(
      () => {
        if (!cancelled && img.naturalWidth > 0) setShown((s) => (s.current === url ? s : { current: url, previous: s.current }));
      },
      () => {
        if (!cancelled && !(img.complete && img.naturalWidth > 0)) setFailed(url);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  const ready = shown.current === url;
  // Before the new image is ready the old one stays fully visible on top; once ready it fades out.
  const old = failed === url ? undefined : ready ? shown.previous : shown.current;
  const layer = (extra: SxProps<Theme>) => [imgSx, extra].flat() as SxProps<Theme>;

  return (
    <>
      <Box
        component="img"
        key={url}
        ref={imgRef}
        src={url}
        alt=""
        draggable={false}
        onLoad={() => setShown(showUpdate)}
        onError={() => setFailed(url)}
        sx={layer({ opacity: ready ? 1 : 0 })}
      />
      {old && old !== url && (
        <Box
          component="img"
          key={`old-${old}`}
          src={old}
          alt=""
          draggable={false}
          onAnimationEnd={() => setShown((s) => ({ current: s.current }))}
          sx={layer({
            animation: ready ? `${fadeOut} ${motion.crossFade}ms ease-out forwards` : "none",
            [REDUCED]: { animation: "none", display: ready ? "none" : "block" },
          })}
        />
      )}
    </>
  );
};

export default CrossFadeImage;
