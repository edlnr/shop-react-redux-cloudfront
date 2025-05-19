import * as cdk from "aws-cdk-lib";
import { ImportServiceStack } from "../lib/import-service-stack";
import { ProductServiceStack } from "../lib/product-service-stack";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";

const app = new cdk.App();

new ImportServiceStack(app, "ImportServiceStack", {});
new ProductServiceStack(app, "ProductServiceStack", {});
new DeployWebAppStack(app, "DeployWebAppStack", {});
