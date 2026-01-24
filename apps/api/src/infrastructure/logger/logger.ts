import tid from 'cls-rtracer';
import context from 'express-http-context';
import { join } from 'node:path';
import tracer from 'tracer';

// 프로젝트 루트의 logs 폴더 (process.cwd() = 명령어 실행 위치)
const rootFolder = join(process.cwd(), 'logs');
const splitFormat = `yyyymmdd`;
const logFormat = '{{timestamp}} {{title}} {{file}}:{{line}} ({{method}}) {{tid}} [{{account}}] {{message}}';
const sqlFormat = '{{timestamp}} {{title}} {{tid}} [{{account}}] {{message}}';
const mongoFormat = '{{timestamp}} {{title}} {{tid}} [{{account}}] {{message}}';
const jsonFormat = '{ timestamp:{{timestamp}}, tid:{{tid}}, payload:{{message}} }';
const dateformat = 'yyyy-mm-dd"T"HH:MM:ss.lo';

/** tracer 로그 데이터 타입 */
interface TracerLogData {
    title: string;
    tid?: string;
    account?: string;
    file?: string;
    line?: number;
    method?: string;
    output?: string;
}

let filter = {
    log: true,
    sql: true,
    net: true,
    debug: true,
    error: true,
    fatal: true,
    console: false,
};

/**
 * root: 파일위치
 * allLogsFileName: 로그 파일명
 * stackIndex: 로거를 사용하는곳을 알아내기 위해사용한다. 기본값 0을 사용하면 logger.ts가 찍힌다.
 * 1을 사용하면 한단계 위의 콜스택인 logger.ts를 사용하는 곳의 파일이 찍힌다.
 * format: 현재 로그 파일의 형식을 커스텀하게 지정한다.
 * preprocess: 로그 오브젝트를 불러와서 커스텀할 필터를 적용한다.
 */

const convTitle = (title: string) => {
    let result: string;

    switch (title) {
        case 'error':
            result = 'ERR';
            break;
        case 'warn':
            result = 'WRN';
            break;
        case 'info':
            result = 'INF';
            break;
        case 'debug':
            result = 'DBG';
            break;
        case 'fatal':
            result = 'FTL';
            break;
        case 'trace':
            result = 'TRC';
            break;
        case 'sql':
            result = 'SQL';
            break;
        case 'mongo':
            result = 'MONGO';
            break;
        default:
            result = 'LOG';
            break;
    }

    return result;
};

const preprocess = (data: TracerLogData) => {
    data.title = convTitle(data.title)?.toUpperCase();
    data.tid = `${tid.id() ? tid.id() : '00000000-0000-0000-0000-000000000000'}`;

    const account = context.get('account_name');
    data.account = account ? account : '';

    const file = data.file && data.file.length > 23 ? data.file.substring(0, 20) + '...' : data.file;
    data.file = file?.padStart(23, ' ');
    data.line = Number(String(data.line ?? '').padEnd(3, ' '));

    const method = data.method && data.method.length > 25 ? data.method.substring(0, 22) + '...' : data.method;
    data.method = method?.padEnd(25, ' ');

    return data;
};

const logConfig = {
    root: rootFolder,
    allLogsFileName: 'log',
    format: logFormat,
    dateformat: dateformat,
    splitFormat: splitFormat,
    stackIndex: 1,
    preprocess: (data: TracerLogData) => {
        preprocess(data);
    },
    transport: (data: TracerLogData) => {
        if (filter.console) console.log(data.output);
    },
};

const sqlConfig = {
    root: rootFolder,
    allLogsFileName: 'log',
    format: sqlFormat,
    dateformat: dateformat,
    splitFormat: splitFormat,
    stackIndex: 1,
    preprocess: (data: TracerLogData) => {
        data.title = 'SQL';
        const account = context.get('account_name');
        data.account = account ? account : '';
        data.tid = `${tid.id() ? tid.id() : '00000000-0000-0000-0000-000000000000'}`;
    },
    transport: (data: TracerLogData) => {
        if (filter.console) console.log(data.output);
    },
};

const mongoConfig = {
    root: rootFolder,
    allLogsFileName: 'log',
    format: mongoFormat,
    dateformat: dateformat,
    splitFormat: splitFormat,
    stackIndex: 1,
    preprocess: (data: TracerLogData) => {
        data.title = 'QUERY';
        const account = context.get('account_name');
        data.account = account ? account : '';
        data.tid = `${tid.id() ? tid.id() : '00000000-0000-0000-0000-000000000000'}`;
    },
    transport: (data: TracerLogData) => {
        if (filter.console) console.log(data.output);
    },
};

const jsonConfig = {
    root: rootFolder,
    allLogsFileName: 'log',
    format: jsonFormat,
    dateformat: dateformat,
    splitFormat: splitFormat,
    stackIndex: 1,
    preprocess: (data: TracerLogData) => {
        const account = context.get('account_name');
        data.account = account ? account : '';
        data.tid = `${tid.id() ? tid.id() : '00000000-0000-0000-0000-000000000000'}`;
    },
    transport: (data: TracerLogData) => {
        if (filter.console) console.log(data.output);
    },
};

/**
 * root: 파일위치
 * allLogsFileName: 로그 파일명
 * stackIndex: 로거를 사용하는곳을 알아내기 위해사용한다. 기본값 0을 사용하면 logger.ts가 찍힌다.
 * 1을 사용하면 한단계 위의 콜스택인 logger.ts를 사용하는 곳의 파일이 찍힌다.
 * format: 현재 로그 파일의 형식을 커스텀하게 지정한다.
 * preprocess: 로그 오브젝트를 불러와서 커스텀할 필터를 적용한다.
 */
const error = tracer.dailyfile({
    ...logConfig,
    ...{
        allLogsFileName: 'err',
    },
});

const log = tracer.dailyfile({
    ...logConfig,
    ...{
        allLogsFileName: 'app',
    },
});

const sql = tracer.dailyfile({
    ...sqlConfig,
    ...{
        allLogsFileName: 'sql',
    },
});

const mongo = tracer.dailyfile({
    ...mongoConfig,
    ...{
        allLogsFileName: 'mongo',
    },
});

const net = tracer.dailyfile({
    ...jsonConfig,
    ...{
        allLogsFileName: 'net',
        format: jsonFormat,
    },
});

/** Logger filter options */
type LoggerFilterOptions = Partial<typeof filter>;

/** HTTP 요청 객체 (Express Request 유사) */
interface HttpRequest {
    method?: string;
    url?: string;
    originalUrl?: string;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: unknown;
    locals?: { log?: { timestamp?: number } };
}

/** 민감 필드 목록 */
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'accesstoken', 'refreshtoken'];

/**
 * 민감 필드를 마스킹하는 유틸리티 함수
 * 원본 객체를 변경하지 않고 새 객체를 반환
 */
const maskSensitiveFields = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => maskSensitiveFields(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
            result[key] = '***';
        } else if (typeof value === 'object' && value !== null) {
            result[key] = maskSensitiveFields(value);
        } else {
            result[key] = value;
        }
    }

    return result;
};

const logger = {
    init(options: LoggerFilterOptions) {
        filter = { ...filter, ...options };
        if (filter.console) console.log(filter);
    },
    sql(...args: unknown[]) {
        if (filter.console) console.log(...args);
        return filter.sql ? sql.log(...args) : null;
    },
    mongo(...args: unknown[]) {
        if (filter.console) console.log(...args);
        return filter.sql ? mongo.log(...args) : null;
    },
    log(...args: unknown[]) {
        if (filter.console) console.log(...args);
        return filter.log ? log.log(...args) : null;
    },
    err(...args: unknown[]) {
        if (filter.console) console.log(...args);
        return filter.log ? log.error(...args) : null;
    },
    error(...args: unknown[]) {
        if (filter.console) console.log(...args);
        return filter.error ? error.error(...args) : null;
    },
    req(req: HttpRequest) {
        if (!filter.net) return;

        const maskedBody = maskSensitiveFields(req.body);
        const message = {
            type: 'REQ',
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
            body: JSON.stringify(maskedBody),
        };

        net.log(message);
        if (filter.console) console.log(message);
    },
    res(code: number, res: unknown, req: HttpRequest) {
        if (!filter.net) return;

        const timestamp = req.locals?.log?.timestamp;
        const maskedBody = maskSensitiveFields(req.body);
        const account = context.get('account_name');
        const message = {
            // 구조화 로그 필드 (UC-4)
            requestId: tid.id() ? String(tid.id()) : '00000000-0000-0000-0000-000000000000',
            account: account ? account : '',
            status: code,
            latency: timestamp ? new Date().getTime() - timestamp : undefined,
            // 기본 로그 필드
            type: 'RES',
            req: JSON.stringify({
                type: 'REQ',
                method: req.method,
                url: req.url,
                params: req.params,
                query: req.query,
                body: JSON.stringify(maskedBody),
            }),
            response: JSON.stringify(res),
        };
        net.log(message);
        log.log(`[RES] [${req.method}] ${req.originalUrl}`, JSON.stringify(message));
        if (filter.console) console.log(message);
    },
};

export { logger };
