import * as cdk from "aws-cdk-lib";
import { ImportServiceStack } from "../lib/import-service-stack";
import { ProductServiceStack } from "../lib/product-service-stack";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";

const app = new cdk.App();

const productServiceStack = new ProductServiceStack(app, "ProductServiceStack", {});
new ImportServiceStack(app, "ImportServiceStack", {
  catalogItemsQueue: productServiceStack.catalogItemsQueue
});
new DeployWebAppStack(app, "DeployWebAppStack", {});
