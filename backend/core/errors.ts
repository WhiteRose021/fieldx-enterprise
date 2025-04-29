export class RateLimitError extends Error {
    constructor() {
      super("Too many login attempts. Please try again later.");
      this.name = "RateLimitError";
    }
  }
  
  export class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
    }
  }
  