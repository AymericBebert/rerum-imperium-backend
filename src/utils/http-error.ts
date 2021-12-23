export class HttpError extends Error {
    public customDetails: string;

    constructor(public code: number, message: string, customDetails = '') {
        super(message);
        this.customDetails = customDetails;
    }
}
