import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface IDataConfig {
  id?: number
  created_at: string;
  user_id: string;
  hour: number;
  minute: number;
  duration_sec: number;
}

