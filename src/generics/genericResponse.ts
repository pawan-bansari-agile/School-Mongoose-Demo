export interface success<T> {
  data: T;
  message: string;
  error: T;
}

export const responseMap = <T>(
  data: T,
  message?: string | '',
  error?: T,
): { data: T; message: string; error: T } => {
  return { data, message: message || '', error };
};

export type record = Record<string, unknown> | Array<unknown>;

export type globalResponse = Promise<success<record>>;
