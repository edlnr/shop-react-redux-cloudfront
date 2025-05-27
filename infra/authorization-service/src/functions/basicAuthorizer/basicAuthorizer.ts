import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { authorizerService } from "../../services/authorizerService";

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Event: ", JSON.stringify(event));
  return await authorizerService.authorize(event);
};
