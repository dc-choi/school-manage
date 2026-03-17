/**
 * Custom CamelCase Plugin
 *
 * CamelCasePlugin 상속 + _id ↔ id 매핑 처리.
 * DB 컬럼 _id는 Prisma 모델에서 id로 매핑되어 있어
 * 표준 CamelCasePlugin의 변환으로는 처리되지 않는다.
 */
import { CamelCasePlugin } from 'kysely';

export class CustomCamelCasePlugin extends CamelCasePlugin {
    override snakeCase(str: string): string {
        if (str === 'id') return '_id';
        return super.snakeCase(str);
    }

    override camelCase(str: string): string {
        if (str === '_id') return 'id';
        return super.camelCase(str);
    }
}
