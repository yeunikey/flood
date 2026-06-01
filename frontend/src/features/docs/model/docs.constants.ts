import { baseUrl } from "@/shared/model/api/instance";
import type { DocPage, EndpointRow } from "./types";

export const apiKeyHeader = "X-API-Key";
export const demoApiKey = "fld_your_api_key";

export const protoModel = `syntax = "proto3";

package data;

message MethodInfo {
  string name = 1;
  string description = 2;
}

message SourceInfo {
  string name = 1;
}

message QclInfo {
  string name = 1;
  string description = 2;
}

message FormattedGroup {
  int32 id = 1;
  string date_utc = 2;
  int32 category = 3;
  string site_code = 4;
  MethodInfo method = 5;
  SourceInfo source = 6;
  QclInfo qcl = 7;
  repeated int32 variables = 8;
  repeated string values = 9;
}

message AllDates {
  string minDate = 1;
  string maxDate = 2;
}

message GetResponse {
  int32 statusCode = 1;
  repeated FormattedGroup groups = 2;
  string startDate = 3;
  string endDate = 4;
  AllDates allDates = 5;
}

message PaginatedResponse {
  int32 statusCode = 1;
  repeated FormattedGroup content = 2;
  int32 total = 3;
  int32 page = 4;
  int32 limit = 5;
  int32 totalPages = 6;
  string minDate = 7;
  string maxDate = 8;
}`;

const decodeNodeExample = `import fs from "node:fs/promises";
import protobuf from "protobufjs";

const root = await protobuf.load("./data.proto");
const PaginatedResponse = root.lookupType("data.PaginatedResponse");

const response = await fetch(
  "${baseUrl}/data/category/2/by-site/11219/paginated-date?page=1&limit=10",
  { headers: { "${apiKeyHeader}": "${demoApiKey}" } }
);

if (!response.ok) {
  throw new Error(await response.text());
}

const bytes = new Uint8Array(await response.arrayBuffer());
await fs.writeFile("response.bin", bytes);

const message = PaginatedResponse.decode(bytes);
const data = PaginatedResponse.toObject(message, {
  defaults: true,
  arrays: true,
});

console.log(data);`;

const decodeBrowserExample = `import { decodePaginatedResponse } from "./data.pb";

const response = await fetch(
  "${baseUrl}/data/category/2/by-site/11219/paginated-date?page=1&limit=10",
  { headers: { "${apiKeyHeader}": "${demoApiKey}" } }
);

const data = decodePaginatedResponse(
  new Uint8Array(await response.arrayBuffer())
);

console.log(data.content);`;

const primaryDocs: DocPage[] = [
  {
    id: "api-key",
    label: "API ключ",
    title: "API ключ для чтения",
    description:
      "API ключ работает с правами viewer. Им можно читать данные и справочники, но нельзя создавать, обновлять, удалять, импортировать файлы или запускать editor/admin действия.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      [
        "hasApiKey",
        "boolean",
        "да",
        "Есть ли у текущего пользователя созданный ключ",
      ],
      [
        "preview",
        "string | null",
        "да",
        "Безопасный фрагмент ключа для отображения",
      ],
      ["createdAt", "ISO date | null", "да", "Дата создания ключа"],
      [
        "apiKey",
        "string",
        "только при создании",
        "Полный ключ показывается один раз",
      ],
    ],
    requestExample: `curl -X POST "${baseUrl}/auth/api-key" \\
  -H "Authorization: Bearer USER_JWT"`,
    responseExample: `{
  "apiKey": "${demoApiKey}",
  "preview": "fld_your...pi_key",
  "createdAt": "2026-06-01T10:00:00.000Z"
}`,
    codeExample: `curl "${baseUrl}/data/category/2/variables" \\
  -H "${apiKeyHeader}: ${demoApiKey}"

curl "${baseUrl}/data/category/2/variables?apiKey=${demoApiKey}"`,
  },
  {
    id: "variables",
    label: "Переменные",
    title: "Получение переменных категории",
    method: "GET",
    path: "/data/category/{categoryId}/variables",
    description:
      "Этот путь надо вызвать перед paginated-date или by-date. Сами proto-ответы содержат только ids переменных и значения; названия, единицы измерения и источники берутся здесь.",
    anchors: ["request", "response", "examples"],
    pathParams: [["categoryId", "number", "да", "ID категории данных"]],
    query: [
      [
        "siteCode",
        "string",
        "нет",
        "Оставляет переменные, которые есть у выбранного гидропоста",
      ],
      ["sourceId", "number", "нет", "Оставляет переменные выбранного источника"],
      [
        "apiKey",
        "string",
        "нет",
        "API ключ, если не передаете заголовок X-API-Key",
      ],
    ],
    responseRows: [
      ["statusCode", "number", "да", "HTTP-статус внутри общего ответа"],
      ["data.variables", "Variable[]", "да", "Список переменных категории"],
      [
        "data.variables[].id",
        "number",
        "да",
        "ID, который приходит в proto поле variables",
      ],
      ["data.variables[].name", "string", "да", "Название переменной"],
      ["data.variables[].unit", "Unit | null", "нет", "Единица измерения"],
      [
        "data.sources",
        "DataSource[]",
        "да",
        "Источники, доступные для фильтра sourceId",
      ],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/variables?siteCode=11219" \\
  -H "Accept: application/json" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": {
    "variables": [
      {
        "id": 1,
        "name": "Q",
        "description": "Расход воды",
        "unit": { "id": 1, "name": "Кубометр в секунду", "symbol": "m3/s" }
      }
    ],
    "sources": [{ "id": 1, "name": "Гидрологический источник" }]
  }
}`,
    errorExample: `{
  "statusCode": 404,
  "message": "Категория не найдена"
}`,
  },
  {
    id: "paginated-date",
    label: "paginated-date",
    title: "Получение данных с пагинацией",
    method: "GET",
    path: "/data/category/{categoryId}/by-site/{siteCode}/paginated-date",
    description:
      "Возвращает страницу групп данных за период. Ответ не JSON, а бинарный application/x-proto с моделью PaginatedResponse.",
    anchors: ["request", "response", "examples", "proto"],
    pathParams: [
      ["categoryId", "number", "да", "ID категории данных"],
      ["siteCode", "string", "да", "Код гидропоста"],
    ],
    query: [
      ["page", "integer", "нет", "Номер страницы, по умолчанию 1"],
      ["limit", "integer", "нет", "Размер страницы, по умолчанию 20"],
      [
        "start",
        "ISO date",
        "нет",
        "Начало периода, например 2026-01-01T00:00:00.000Z",
      ],
      ["end", "ISO date", "нет", "Конец периода"],
      ["sourceId", "number", "нет", "Фильтр по источнику"],
      [
        "apiKey",
        "string",
        "нет",
        "API ключ, если не передаете заголовок X-API-Key",
      ],
    ],
    responseRows: [
      ["statusCode", "number", "да", "Статус успешного ответа"],
      ["content", "FormattedGroup[]", "да", "Группы данных текущей страницы"],
      ["total", "number", "да", "Общее количество групп"],
      ["page", "number", "да", "Текущая страница"],
      ["limit", "number", "да", "Размер страницы"],
      ["totalPages", "number", "да", "Количество страниц"],
      ["minDate / maxDate", "ISO date", "да", "Полный доступный диапазон дат"],
      ["content[].variables", "number[]", "да", "ID переменных"],
      [
        "content[].values",
        "string[]",
        "да",
        "Значения в том же порядке, что variables",
      ],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/by-site/11219/paginated-date?page=1&limit=10&start=2026-01-01T00:00:00.000Z" \\
  -H "Accept: application/x-proto" \\
  -H "${apiKeyHeader}: ${demoApiKey}" \\
  --output paginated-date.bin`,
    responseExample: `{
  "statusCode": 200,
  "content": [
    {
      "id": 1001,
      "date_utc": "2026-01-01T00:00:00.000Z",
      "category": 2,
      "site_code": "11219",
      "method": { "name": "observed", "description": "Наблюдение" },
      "source": { "name": "Источник" },
      "qcl": { "name": "checked", "description": "Проверено" },
      "variables": [1, 2],
      "values": ["14.2", "0.7"]
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 10,
  "totalPages": 12,
  "minDate": "2012-01-01T00:00:00.000Z",
  "maxDate": "2026-06-01T00:00:00.000Z"
}`,
    errorExample: `{
  "statusCode": 401,
  "message": "Unauthorized"
}`,
    codeExample: decodeNodeExample,
  },
  {
    id: "by-date",
    label: "by-date",
    title: "Получение данных за период",
    method: "GET",
    path: "/data/category/{categoryId}/by-site/{siteCode}/by-date",
    description:
      "Возвращает все группы за выбранный период без пагинации. Ответ бинарный application/x-proto с моделью GetResponse.",
    anchors: ["request", "response", "examples", "proto"],
    pathParams: [
      ["categoryId", "number", "да", "ID категории данных"],
      ["siteCode", "string", "да", "Код гидропоста"],
    ],
    query: [
      ["start", "ISO date", "нет", "Начало периода"],
      ["end", "ISO date", "нет", "Конец периода"],
      ["sourceId", "number", "нет", "Фильтр по источнику"],
      [
        "apiKey",
        "string",
        "нет",
        "API ключ, если не передаете заголовок X-API-Key",
      ],
    ],
    responseRows: [
      ["statusCode", "number", "да", "Статус успешного ответа"],
      ["groups", "FormattedGroup[]", "да", "Все группы за период"],
      ["startDate / endDate", "ISO date", "да", "Фактически примененный период"],
      ["allDates.minDate", "ISO date", "да", "Минимальная дата в наборе"],
      ["allDates.maxDate", "ISO date", "да", "Максимальная дата в наборе"],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/by-site/11219/by-date?start=2026-01-01T00:00:00.000Z&end=2026-01-31T00:00:00.000Z" \\
  -H "Accept: application/x-proto" \\
  -H "${apiKeyHeader}: ${demoApiKey}" \\
  --output by-date.bin`,
    responseExample: `{
  "statusCode": 200,
  "groups": [
    {
      "id": 1001,
      "date_utc": "2026-01-01T00:00:00.000Z",
      "category": 2,
      "site_code": "11219",
      "variables": [1, 2],
      "values": ["14.2", "0.7"]
    }
  ],
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T00:00:00.000Z",
  "allDates": {
    "minDate": "2012-01-01T00:00:00.000Z",
    "maxDate": "2026-06-01T00:00:00.000Z"
  }
}`,
    errorExample: `{
  "statusCode": 404,
  "message": "Not Found"
}`,
    codeExample: `const root = await protobuf.load("./data.proto");
const GetResponse = root.lookupType("data.GetResponse");
const bytes = new Uint8Array(await response.arrayBuffer());
const data = GetResponse.toObject(GetResponse.decode(bytes), {
  defaults: true,
  arrays: true,
});`,
  },
  {
    id: "proto",
    label: "application/x-proto",
    title: "Protocol Buffers ответы",
    description:
      "application/x-proto означает, что тело ответа сериализовано через Protocol Buffers. Это не JSON и не zip-архив: файл .bin нужно читать как байты и декодировать по data.proto. Если HTTP-клиент получил gzip от proxy, он обычно распакует транспорт автоматически до декодирования.",
    anchors: ["request", "response", "examples", "proto"],
    responseRows: [
      ["FormattedGroup.id", "number", "да", "ID группы данных"],
      ["FormattedGroup.date_utc", "ISO date", "да", "Дата наблюдения в UTC"],
      ["FormattedGroup.category", "number", "да", "ID категории"],
      ["FormattedGroup.site_code", "string", "да", "Код гидропоста"],
      [
        "FormattedGroup.method/source/qcl",
        "object",
        "нет",
        "Метод, источник и контроль качества",
      ],
      [
        "FormattedGroup.variables",
        "number[]",
        "да",
        "ID переменных из /data/category/{categoryId}/variables",
      ],
      [
        "FormattedGroup.values",
        "string[]",
        "да",
        "Значения. Индекс совпадает с variables",
      ],
    ],
    codeExample: decodeBrowserExample,
  },
];

export const viewerEndpoints: EndpointRow[] = [
  ["GET", "/data/category", "JSON", "Список категорий"],
  ["GET", "/data/category/sites", "JSON", "Категории вместе с гидропостами"],
  ["GET", "/data/category/{categoryId}/sites", "JSON", "Гидропосты категории"],
  [
    "GET",
    "/data/category/{categoryId}/variables",
    "JSON",
    "Переменные и источники категории",
  ],
  ["GET", "/data/category/{categoryId}/values", "JSON", "Значения категории"],
  [
    "GET",
    "/data/category/{categoryId}/by-site/{siteCode}",
    "JSON",
    "Группы категории по гидропосту",
  ],
  [
    "GET",
    "/data/category/{categoryId}/by-site/{siteCode}/paginated",
    "JSON",
    "Пагинация без date range",
  ],
  [
    "GET",
    "/data/category/{categoryId}/by-site/{siteCode}/paginated-date",
    "application/x-proto",
    "Пагинация с date range",
  ],
  [
    "GET",
    "/data/category/{categoryId}/by-site/{siteCode}/by-date",
    "application/x-proto",
    "Все группы за период",
  ],
  ["GET", "/data/datavalue/{id}", "JSON", "Одно значение по ID"],
  ["GET", "/data/groups", "JSON", "Все группы"],
  ["GET", "/data/stats", "JSON", "Статистика данных"],
  ["GET", "/data/variables", "JSON", "Все переменные"],
  ["GET", "/data/variables/{id}", "JSON", "Одна переменная"],
  ["GET", "/data/variables/units", "JSON", "Единицы измерения"],
  ["GET", "/data/metadata/sources", "JSON", "Источники"],
  ["GET", "/data/metadata/methods", "JSON", "Методы"],
  ["GET", "/data/metadata/qcls", "JSON", "QCL справочник"],
  ["GET", "/data/sites", "JSON", "Гидропосты"],
  ["GET", "/data/sites/types", "JSON", "Типы гидропостов"],
  ["GET", "/data/spatial", "JSON", "Пространственные слои"],
  ["GET", "/data/spatial/{id}", "JSON", "Один spatial слой"],
  ["GET", "/data/spatial/stats", "JSON", "Статистика spatial"],
  ["GET", "/data/spatial/summary", "JSON", "Краткий список spatial"],
  ["GET", "/data/pools", "JSON", "Бассейны"],
  ["GET", "/data/images/{uuid}", "binary", "Изображение"],
  ["GET", "/data/files/{uuid}", "binary", "Файл"],
];

const additionalGetDocs: DocPage[] = [
  {
    id: "get-categories",
    label: "Категории",
    title: "Получение категорий",
    method: "GET",
    path: "/data/category",
    description:
      "Возвращает список категорий данных, доступных viewer. Категории используются как categoryId в запросах данных и переменных.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "Category[]", "да", "Массив категорий"],
      ["data[].id", "number", "да", "ID категории"],
      ["data[].name", "string", "да", "Название категории"],
      ["data[].description", "string | null", "нет", "Описание категории"],
    ],
    requestExample: `curl "${baseUrl}/data/category" \\
  -H "Accept: application/json" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": [
    { "id": 2, "name": "Гидрология", "description": "Наблюдения гидропостов" }
  ]
}`,
  },
  {
    id: "get-category-sites-tree",
    label: "Категории с постами",
    title: "Получение категорий с гидропостами",
    method: "GET",
    path: "/data/category/sites",
    description:
      "Возвращает категории и вложенные гидропосты. Удобно для построения дерева выбора данных.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "Array<{ category, sites }>", "да", "Категории с массивом гидропостов"],
      ["data[].category", "Category", "да", "Категория"],
      ["data[].sites", "Site[]", "да", "Гидропосты категории"],
    ],
    requestExample: `curl "${baseUrl}/data/category/sites" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": [
    {
      "category": { "id": 2, "name": "Гидрология" },
      "sites": [{ "id": 10, "code": "11219", "name": "Уба" }]
    }
  ]
}`,
  },
  {
    id: "get-category-sites",
    label: "Посты категории",
    title: "Получение гидропостов категории",
    method: "GET",
    path: "/data/category/{categoryId}/sites",
    description:
      "Возвращает гидропосты конкретной категории. Значение site.code используется как siteCode в запросах by-site.",
    anchors: ["request", "response", "examples"],
    pathParams: [["categoryId", "number", "да", "ID категории"]],
    responseRows: [
      ["category", "Category", "да", "Категория"],
      ["sites", "Site[]", "да", "Гидропосты категории"],
      ["sites[].code", "string", "да", "Код гидропоста для URL"],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/sites" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "category": { "id": 2, "name": "Гидрология" },
  "sites": [{ "id": 10, "code": "11219", "name": "Уба" }]
}`,
  },
  {
    id: "get-category-values",
    label: "Значения категории",
    title: "Получение значений категории",
    method: "GET",
    path: "/data/category/{categoryId}/values",
    description:
      "Возвращает значения данных по категории. Для больших выборок лучше использовать paginated-date или by-date.",
    anchors: ["request", "response", "examples"],
    pathParams: [["categoryId", "number", "да", "ID категории"]],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "DataValue[]", "да", "Массив значений"],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/values" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": [
    { "id": 1, "value": "14.2" }
  ]
}`,
  },
  {
    id: "get-by-site",
    label: "Данные поста",
    title: "Получение групп по гидропосту",
    method: "GET",
    path: "/data/category/{categoryId}/by-site/{siteCode}",
    description:
      "Возвращает группы данных выбранной категории и гидропоста без фильтра дат и без protobuf.",
    anchors: ["request", "response", "examples"],
    pathParams: [
      ["categoryId", "number", "да", "ID категории"],
      ["siteCode", "string", "да", "Код гидропоста"],
    ],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "FormattedGroup[]", "да", "Группы данных"],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/by-site/11219" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": [
    { "id": 1001, "site_code": "11219", "variables": [1], "values": ["14.2"] }
  ]
}`,
  },
  {
    id: "get-paginated",
    label: "paginated",
    title: "Получение данных с JSON-пагинацией",
    method: "GET",
    path: "/data/category/{categoryId}/by-site/{siteCode}/paginated",
    description:
      "Возвращает постраничные данные в JSON. Для периодов по датам и более компактной передачи используйте paginated-date.",
    anchors: ["request", "response", "examples"],
    pathParams: [
      ["categoryId", "number", "да", "ID категории"],
      ["siteCode", "string", "да", "Код гидропоста"],
    ],
    query: [
      ["page", "integer", "нет", "Номер страницы, по умолчанию 1"],
      ["limit", "integer", "нет", "Размер страницы, по умолчанию 20"],
      ["sourceId", "number", "нет", "Фильтр по источнику"],
      ["apiKey", "string", "нет", "API ключ, если не передаете заголовок X-API-Key"],
    ],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data.content", "FormattedGroup[]", "да", "Данные текущей страницы"],
      ["data.total", "number", "да", "Общее количество записей"],
      ["data.page / data.limit", "number", "да", "Пагинация"],
    ],
    requestExample: `curl "${baseUrl}/data/category/2/by-site/11219/paginated?page=1&limit=20" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": {
    "content": [],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}`,
  },
  {
    id: "get-datavalue",
    label: "Значение по ID",
    title: "Получение одного значения",
    method: "GET",
    path: "/data/datavalue/{id}",
    description: "Возвращает одну запись значения по ID.",
    anchors: ["request", "response", "examples"],
    pathParams: [["id", "number", "да", "ID значения"]],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "DataValue", "да", "Запись значения"],
    ],
    requestExample: `curl "${baseUrl}/data/datavalue/1" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": { "id": 1, "value": "14.2" }
}`,
    errorExample: `{
  "statusCode": 404,
  "message": "Таких данных не существует"
}`,
  },
  {
    id: "get-groups",
    label: "Группы",
    title: "Получение всех групп",
    method: "GET",
    path: "/data/groups",
    description:
      "Возвращает группы данных. Для пользовательских таблиц обычно удобнее by-site или paginated-date.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "Group[]", "да", "Массив групп"],
    ],
    requestExample: `curl "${baseUrl}/data/groups" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": []
}`,
  },
  {
    id: "get-data-stats",
    label: "Статистика данных",
    title: "Получение статистики данных",
    method: "GET",
    path: "/data/stats",
    description:
      "Возвращает агрегированную статистику по данным, категориям, гидропостам и переменным.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "DataStats", "да", "Объект статистики"],
    ],
    requestExample: `curl "${baseUrl}/data/stats" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": {
    "values": 0,
    "categories": 0,
    "variables": 0,
    "sites": 0
  }
}`,
  },
  {
    id: "get-variables-all",
    label: "Все переменные",
    title: "Получение всех переменных",
    method: "GET",
    path: "/data/variables",
    description:
      "Возвращает полный справочник переменных. Для переменных конкретной категории используйте /data/category/{categoryId}/variables.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID переменной"],
      ["name", "string", "да", "Название"],
      ["unit", "Unit | null", "нет", "Единица измерения"],
    ],
    requestExample: `curl "${baseUrl}/data/variables" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 1, "name": "Q", "unit": { "symbol": "m3/s" } }
]`,
  },
  {
    id: "get-variable-one",
    label: "Переменная по ID",
    title: "Получение одной переменной",
    method: "GET",
    path: "/data/variables/{id}",
    description: "Возвращает переменную по ID.",
    anchors: ["request", "response", "examples"],
    pathParams: [["id", "number", "да", "ID переменной"]],
    responseRows: [
      ["id", "number", "да", "ID переменной"],
      ["name", "string", "да", "Название"],
      ["unit", "Unit | null", "нет", "Единица измерения"],
    ],
    requestExample: `curl "${baseUrl}/data/variables/1" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{ "id": 1, "name": "Q", "unit": { "symbol": "m3/s" } }`,
  },
  {
    id: "get-units",
    label: "Единицы измерения",
    title: "Получение единиц измерения",
    method: "GET",
    path: "/data/variables/units",
    description: "Возвращает справочник единиц измерения переменных.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID единицы"],
      ["name", "string", "да", "Название"],
      ["symbol", "string", "да", "Символ единицы"],
    ],
    requestExample: `curl "${baseUrl}/data/variables/units" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 1, "name": "Кубометр в секунду", "symbol": "m3/s" }
]`,
  },
  {
    id: "get-metadata-sources",
    label: "Источники",
    title: "Получение источников",
    method: "GET",
    path: "/data/metadata/sources",
    description: "Возвращает справочник источников данных для фильтра sourceId.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID источника"],
      ["name", "string", "да", "Название источника"],
    ],
    requestExample: `curl "${baseUrl}/data/metadata/sources" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 1, "name": "Источник" }
]`,
  },
  {
    id: "get-metadata-methods",
    label: "Методы",
    title: "Получение методов",
    method: "GET",
    path: "/data/metadata/methods",
    description: "Возвращает справочник методов получения или расчета данных.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID метода"],
      ["name", "string", "да", "Название метода"],
      ["description", "string | null", "нет", "Описание метода"],
    ],
    requestExample: `curl "${baseUrl}/data/metadata/methods" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 1, "name": "observed", "description": "Наблюдение" }
]`,
  },
  {
    id: "get-metadata-qcls",
    label: "QCL",
    title: "Получение QCL",
    method: "GET",
    path: "/data/metadata/qcls",
    description: "Возвращает справочник уровней контроля качества данных.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID QCL"],
      ["name", "string", "да", "Название"],
      ["description", "string | null", "нет", "Описание"],
    ],
    requestExample: `curl "${baseUrl}/data/metadata/qcls" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 1, "name": "checked", "description": "Проверено" }
]`,
  },
  {
    id: "get-sites",
    label: "Гидропосты",
    title: "Получение гидропостов",
    method: "GET",
    path: "/data/sites",
    description: "Возвращает справочник гидропостов.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID гидропоста"],
      ["code", "string", "да", "Код для запросов by-site"],
      ["name", "string", "да", "Название"],
      ["latitude / longtitude", "number", "да", "Координаты"],
    ],
    requestExample: `curl "${baseUrl}/data/sites" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 10, "code": "11219", "name": "Уба", "latitude": 50.0, "longtitude": 82.0 }
]`,
  },
  {
    id: "get-site-types",
    label: "Типы постов",
    title: "Получение типов гидропостов",
    method: "GET",
    path: "/data/sites/types",
    description: "Возвращает справочник типов гидропостов.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["id", "number", "да", "ID типа"],
      ["name", "string", "да", "Название типа"],
      ["description", "string | null", "нет", "Описание"],
    ],
    requestExample: `curl "${baseUrl}/data/sites/types" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `[
  { "id": 1, "name": "Гидропост", "description": "Пункт наблюдения" }
]`,
  },
  {
    id: "get-spatial",
    label: "Spatial слои",
    title: "Получение пространственных слоев",
    method: "GET",
    path: "/data/spatial",
    description: "Возвращает список пространственных слоев с настройками отображения.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["status", "number", "да", "HTTP-статус внутри ответа"],
      ["data", "Spatial[]", "да", "Массив spatial слоев"],
    ],
    requestExample: `curl "${baseUrl}/data/spatial" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "status": 200,
  "data": [
    { "id": 1, "name": "Зона затопления", "type": "geojson" }
  ]
}`,
  },
  {
    id: "get-spatial-one",
    label: "Spatial по ID",
    title: "Получение одного spatial слоя",
    method: "GET",
    path: "/data/spatial/{id}",
    description: "Возвращает spatial слой по ID.",
    anchors: ["request", "response", "examples"],
    pathParams: [["id", "number", "да", "ID spatial слоя"]],
    responseRows: [
      ["status", "number", "да", "HTTP-статус внутри ответа"],
      ["data", "Spatial", "да", "Spatial слой"],
    ],
    requestExample: `curl "${baseUrl}/data/spatial/1" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "status": 200,
  "data": { "id": 1, "name": "Зона затопления", "type": "geojson" }
}`,
  },
  {
    id: "get-spatial-stats",
    label: "Spatial статистика",
    title: "Получение статистики spatial",
    method: "GET",
    path: "/data/spatial/stats",
    description: "Возвращает агрегированную статистику по spatial слоям.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["status", "number", "да", "HTTP-статус внутри ответа"],
      ["data", "SpatialStats", "да", "Статистика spatial"],
    ],
    requestExample: `curl "${baseUrl}/data/spatial/stats" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "status": 200,
  "data": { "total": 0 }
}`,
  },
  {
    id: "get-spatial-summary",
    label: "Spatial summary",
    title: "Получение краткого списка spatial",
    method: "GET",
    path: "/data/spatial/summary",
    description:
      "Возвращает облегченный список spatial слоев для таблиц, селектов и связей.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["status", "number", "да", "HTTP-статус внутри ответа"],
      ["data", "SpatialSummary[]", "да", "Краткий список spatial"],
    ],
    requestExample: `curl "${baseUrl}/data/spatial/summary" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "status": 200,
  "data": [{ "id": 1, "name": "Зона затопления" }]
}`,
  },
  {
    id: "get-pools",
    label: "Бассейны",
    title: "Получение бассейнов",
    method: "GET",
    path: "/data/pools",
    description:
      "Возвращает бассейны и связанные с ними гидропосты, spatial слои или HEC-RAS проекты.",
    anchors: ["request", "response", "examples"],
    responseRows: [
      ["statusCode", "number", "да", "Статус ответа"],
      ["data", "Pool[]", "да", "Массив бассейнов"],
    ],
    requestExample: `curl "${baseUrl}/data/pools" \\
  -H "${apiKeyHeader}: ${demoApiKey}"`,
    responseExample: `{
  "statusCode": 200,
  "data": [
    { "id": 1, "name": "Уба", "description": "Бассейн реки" }
  ]
}`,
  },
  {
    id: "get-image",
    label: "Изображение",
    title: "Получение изображения",
    method: "GET",
    path: "/data/images/{uuid}",
    description:
      "Возвращает бинарное изображение. Ответ приходит с mimetype исходного файла и открывается inline.",
    anchors: ["request", "response", "examples"],
    pathParams: [["uuid", "string", "да", "UUID изображения"]],
    responseRows: [
      ["body", "binary", "да", "Байты изображения"],
      ["Content-Type", "image/*", "да", "MIME-тип изображения"],
    ],
    requestExample: `curl "${baseUrl}/data/images/00000000-0000-4000-8000-000000000000" \\
  -H "${apiKeyHeader}: ${demoApiKey}" \\
  --output image.png`,
    responseExample: `PNG/JPEG/WebP bytes`,
  },
  {
    id: "get-file",
    label: "Файл",
    title: "Получение файла",
    method: "GET",
    path: "/data/files/{uuid}",
    description:
      "Возвращает бинарный файл по UUID. Ответ приходит с mimetype исходного файла и открывается inline.",
    anchors: ["request", "response", "examples"],
    pathParams: [["uuid", "string", "да", "UUID файла"]],
    responseRows: [
      ["body", "binary", "да", "Байты файла"],
      ["Content-Type", "string", "да", "MIME-тип файла"],
    ],
    requestExample: `curl "${baseUrl}/data/files/00000000-0000-4000-8000-000000000000" \\
  -H "${apiKeyHeader}: ${demoApiKey}" \\
  --output file.bin`,
    responseExample: `Binary file bytes`,
  },
];

export const docs: DocPage[] = [...primaryDocs, ...additionalGetDocs];

export const anchorLabels: Record<string, string> = {
  request: "Запрос",
  response: "Ответ",
  examples: "Примеры",
  proto: "Proto модели",
};
