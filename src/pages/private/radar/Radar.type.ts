import type { Dispatch, SetStateAction } from 'react';
import type { RadarPreferences, RadarResult } from '@business/service/Radar.service';

export type RadarViewProps = {
  form: RadarPreferences;
  setForm: Dispatch<SetStateAction<RadarPreferences>>;
  saved: RadarPreferences | null;
  result: RadarResult | null;
  loading: boolean;
  error: string;
  notice: string;
  visible: number;
  firstName: string;
  dirty: boolean;
  onSearch(save: boolean): Promise<void>;
  onShowMore(): void;
};
