import {
  Monitor,
  Mountain,
  PenTool,
  Target,
  Users,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { ProgramIconKey } from "@/lib/types";

export const programIconMap: Record<ProgramIconKey, LucideIcon> = {
  "laser-survival": Target,
  "sky-swing": Wind,
  "sports-climbing": Mountain,
  "sports-day": Users,
  "ai-homepage": Monitor,
  "ai-diary": PenTool,
};
