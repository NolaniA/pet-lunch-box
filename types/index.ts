import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface IDataConfig {
  id?:number
  hour: number;
  minute: number;
  duration_sec: number;
}

