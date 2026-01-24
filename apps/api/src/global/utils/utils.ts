import { logger } from '~/infrastructure/logger/logger.js';

export const getOsEnv = (key: string): string => {
    if (typeof process.env[key] === 'undefined') {
        logger.error(`Environment variable ${key} is not set.`);
        throw new Error(`Environment variable ${key} is not set.`);
    }

    return process.env[key] as string;
};

export const normalizePort = (port: string): number | string | boolean => {
    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort)) {
        // named pipe
        return port;
    }
    if (parsedPort >= 0) {
        // port number
        return parsedPort;
    }
    return false;
};

/**
 * 해당 연도의 토요일, 일요일을 반환한다.
 *
 * @param year
 * @returns
 */
export const getYearDate = async (year: number) => {
    const month = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const sunday: Array<number[]> = []; // 1년중 일요일에 해당하는 날
    const saturday: Array<number[]> = []; // 1년중 토요일에 해당하는 날

    month.forEach((e) => {
        const tempSunday: number[] = [];
        const tempSaturday: number[] = [];
        const lastDay = new Date(year, e, 0).getDate();

        for (let i = 1; i <= lastDay; i++) {
            const date = new Date(year, e - 1, i);
            if (date.getDay() === 0) {
                tempSunday.push(i);
            }
            if (date.getDay() === 6) {
                tempSaturday.push(i);
            }
        }
        sunday.push(tempSunday);
        saturday.push(tempSaturday);
    });

    return {
        sunday,
        saturday,
    };
};

/**
 * year, month, day의 값으로 YYYYMMDD형식의 문자열을 반환한다.
 *
 * @param year
 * @param month
 * @param day
 * @returns
 */
export const getFullTime = async (year: number, month: number, day: number) => {
    let fullTime: string;

    if (month < 10 && day < 10)
        fullTime = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
    else if (month < 10) fullTime = `${year}${month.toString().padStart(2, '0')}${day}`;
    else if (day < 10) fullTime = `${year}${month}${day.toString().padStart(2, '0')}`;
    else fullTime = `${year}${month}${day}`;

    return fullTime;
};
