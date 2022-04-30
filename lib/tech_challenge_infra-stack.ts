import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import ec2 = require('aws-cdk-lib/aws-ec2');

export class TechChallengeInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC
    new ec2.Vpc(this, 'TechChallengeInfraVpc');
  }
}
