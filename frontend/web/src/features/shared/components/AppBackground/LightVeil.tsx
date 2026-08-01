import './LightVeil.css';

type Props = {
  /** Three CSS colors for the gradient blobs. Defaults come from the host
   * element's --lv-* custom properties, falling back to teal tints. */
  colors?: [string, string, string];
  /** Overall opacity multiplier (0-1). Default 1. */
  opacity?: number;
};

/**
 * Soft animated background for light themes. Three large, blurred teal
 * gradient blobs drift slowly across a transparent field.
 *
 * Unlike the DarkVeil CPPN (which outputs dark, muted pixels that desaturate
 * to grey when blended over white), LightVeil is built from the ground up for
 * light surfaces: each blob is a bright, semi-transparent radial gradient,
 * so the teal reads as actual color over white.
 */
export default function LightVeil({ colors, opacity = 1 }: Props) {
  const style = {
    ...(colors
      ? ({
          '--lv-a': colors[0],
          '--lv-b': colors[1],
          '--lv-c': colors[2],
        } as React.CSSProperties)
      : {}),
    opacity,
  } as React.CSSProperties;

  return (
    <div className="lightveil" style={style} aria-hidden>
      <div className="lightveil__blob lightveil__blob--a" />
      <div className="lightveil__blob lightveil__blob--b" />
      <div className="lightveil__blob lightveil__blob--c" />
    </div>
  );
}
