#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TechChallengePipelineStack } from '../lib/tech_challenge_pipeline_stack';

const app = new cdk.App();

const PipelineStack = new TechChallengePipelineStack(app, 'TechChallengePipelineStack', {});