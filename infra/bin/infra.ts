import * as cdk from "aws-cdk-lib";
import { ImportServiceStack } from "../lib/import-service-stack";
import { ProductServiceStack } from "../lib/product-service-stack";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { AuthorizationServiceStack } from "../lib/authorization-service-stack";

const app = new cdk.App();

const authServiceStack = new AuthorizationServiceStack(
  app,
  "AuthorizationServiceStack",
  {}
);
const productServiceStack = new ProductServiceStack(
  app,
  "ProductServiceStack",
  {}
);
new ImportServiceStack(app, "ImportServiceStack", {
  catalogItemsQueue: productServiceStack.catalogItemsQueue,
  basicAuthorizerLambdaArn: authServiceStack.basicAuthorizerLambdaArn,
});
new DeployWebAppStack(app, "DeployWebAppStack", {});
