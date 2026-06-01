export type ApiKeyInfo = {
  hasApiKey: boolean;
  preview: string | null;
  createdAt: string | null;
};

export type GeneratedApiKey = {
  apiKey: string;
  preview: string;
  createdAt: string;
};

export type ParamRow = [
  name: string,
  type: string,
  required: string,
  description: string,
];

export type EndpointRow = [
  method: string,
  path: string,
  response: string,
  description: string,
];

export type DocPage = {
  id: string;
  title: string;
  label: string;
  method?: string;
  path?: string;
  description: string;
  anchors: string[];
  query?: ParamRow[];
  pathParams?: ParamRow[];
  responseRows?: ParamRow[];
  requestExample?: string;
  responseExample?: string;
  errorExample?: string;
  codeExample?: string;
};
