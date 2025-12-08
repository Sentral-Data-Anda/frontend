export interface Bapel {
  id: number;
  code: string;
  name: string;
  haveRules?: boolean;

  ruleType?: string[];
  dayOfWeek?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  weekOfMonth?: string;
}

export interface FormBapel {
  name: string;
  haveRules: boolean;

  ruleType?: string[];
  dayOfWeek?: string;
  date?: string | null;
  startTime?: string;
  endTime?: string;
  weekOfMonth?: string[];
}
