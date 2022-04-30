#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TechChallengeInfraStack } from '../lib/tech_challenge_infra-stack';
import { TechChallengePipelineStack } from '../lib/tech_challenge_pipeline_stack';

const app = new cdk.App();

new TechChallengeInfraStack(app, 'TechChallengeInfraStack', {});

new TechChallengePipelineStack(app, 'TechChallengePipelineStack', {});