declare module "react-simple-maps" {
  import { ComponentType, ReactNode, SVGProps, CSSProperties } from "react";

  interface GeographiesChildrenProps {
    geographies: Array<{ rsmKey: string; properties: Record<string, unknown> }>;
  }

  interface GeographyStyle {
    default?: CSSProperties;
    hover?: CSSProperties;
    pressed?: CSSProperties;
  }

  export const ComposableMap: ComponentType<{
    projectionConfig?: Record<string, unknown>;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
  }>;

  export const ZoomableGroup: ComponentType<{
    zoom?: number;
    center?: [number, number];
    children?: ReactNode;
    [key: string]: unknown;
  }>;

  export const Geographies: ComponentType<{
    geography: unknown;
    children: (props: GeographiesChildrenProps) => ReactNode;
    [key: string]: unknown;
  }>;

  export const Geography: ComponentType<
    SVGProps<SVGPathElement> & {
      geography?: unknown;
      style?: GeographyStyle;
      [key: string]: unknown;
    }
  >;

  export const Marker: ComponentType<{
    coordinates: [number, number];
    children?: ReactNode;
    [key: string]: unknown;
  }>;

  export const Annotation: ComponentType<{
    subject: [number, number];
    children?: ReactNode;
    [key: string]: unknown;
  }>;
}
