export interface success<T> {
  data: T;
  message: string;
}

export const responseMap = <T>(
  data: T,
  message?: string | '',
): { data: T; message: string } => {
  return { data, message: message || '' };
};

export type record = Record<string, unknown> | Array<unknown>;

export type globalResponse = Promise<success<record>>;
