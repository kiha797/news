declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    VISITOR_ADMIN_PIN?: string;
  }
}
