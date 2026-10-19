export class MultiViewError extends Error {
  constructor(code, userMessage, technicalDetail = '') {
    super(userMessage);
    this.name = 'MultiViewError';
    this.code = code;
    this.userMessage = userMessage;
    this.technicalDetail = technicalDetail;
  }
}
