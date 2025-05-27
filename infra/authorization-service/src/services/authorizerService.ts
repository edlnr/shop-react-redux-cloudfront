import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

const EXPECTED_USERNAME = process.env.USERNAME;
const EXPECTED_PASSWORD = process.env.PASSWORD;

export class AuthorizerService {
  async authorize(
    event: APIGatewayTokenAuthorizerEvent
  ): Promise<APIGatewayAuthorizerResult> {
    try {
      if (!event.authorizationToken) {
        console.log("No authorization token provided");
        return this.generatePolicy("undefined", "Deny", event.methodArn, 401);
      }

      const token = event.authorizationToken.replace("Basic ", "");
      console.log("Token: ", token);

      const credentials = Buffer.from(token, "base64").toString("utf-8");
      console.log("Credentials format (username:password): ", credentials);

      const [providedUsername, providedPassword] = credentials.split(":");

      if (!EXPECTED_USERNAME || !EXPECTED_PASSWORD) {
        console.error("Missing environment variables: USERNAME or PASSWORD");
        return this.generatePolicy("undefined", "Deny", event.methodArn, 500);
      }

      if (
        providedUsername === EXPECTED_USERNAME &&
        providedPassword === EXPECTED_PASSWORD
      ) {
        console.log("Authorized successfully");
        return this.generatePolicy(providedUsername, "Allow", event.methodArn);
      } else {
        console.log("Access denied: Invalid credentials");
        return this.generatePolicy(
          providedUsername,
          "Deny",
          event.methodArn,
          403
        );
      }
    } catch (error) {
      console.error("Error during authorization:", error);
      return this.generatePolicy("undefined", "Deny", event.methodArn, 403);
    }
  }

  generatePolicy(
    principalId: string,
    effect: "Allow" | "Deny",
    resource: string,
    statusCode?: number
  ): APIGatewayAuthorizerResult {
    const authResponse: APIGatewayAuthorizerResult = {
      principalId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: resource,
          },
        ],
      },
      context: statusCode ? { statusCode: statusCode } : undefined,
    };

    return authResponse;
  }
}

export const authorizerService = new AuthorizerService();
