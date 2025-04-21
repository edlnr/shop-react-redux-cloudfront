import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "../lib/product-service-stack";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";

const app = new cdk.App();

new ProductServiceStack(app, "ProductServiceStack", {});
new DeployWebAppStack(app, "DeployWebAppStack", {});
