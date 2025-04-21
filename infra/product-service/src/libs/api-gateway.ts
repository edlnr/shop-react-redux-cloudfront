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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
  },
  body: JSON.stringify(body),
});
