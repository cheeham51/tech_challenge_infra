#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TechChallengePipelineStack } from '../lib/tech_challenge_pipeline_stack';
import { TechChallengeNetworkStack } from '../lib/tech_challenge_network_stack';
import { TechChallengeDatabaseStack } from '../lib/tech_challenge_database_stack';

const app = new cdk.App();

const NetworkStack = new TechChallengeNetworkStack(app, 'TechChallengeNetworkStack', {})

const DatabaseStack = new TechChallengeDatabaseStack(app, 'TechChallengeDatabaseStack', {
    vpc: NetworkStack.vpc
})

const PipelineStack = new TechChallengePipelineStack(app, 'TechChallengePipelineStack', {
    vpc: NetworkStack.vpc
});