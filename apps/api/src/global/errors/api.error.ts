export class ApiError extends Error {
    public constructor(
        public code: number,
        message?: string
    ) {
        super(message);
        this.code = code;
    }
}
