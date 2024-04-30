#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { StationInfrastructureStack } from "./infrastructure-stack";
import { configurations } from "./app-config";

const app = new App();
const buildEnvironment = (app.node.tryGetContext("env") || "dev").trim().toLowerCase();

const config = configurations[buildEnvironment];
const stack = new StationInfrastructureStack(app, "StationInfrastructureStack", config);
