const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

if (!CLOUDFRONT_URL) {
  console.error("CRITICAL: CLOUDFRONT_URL environment variable is not set!");
  throw new Error(
    "Server configuration error: Required origin URL is missing."
  );
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}

export const formatResponse = (
  statusCode: number,
  body: any
): APIGatewayResponse => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": CLOUDFRONT_URL,
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});
