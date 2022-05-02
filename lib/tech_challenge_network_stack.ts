import { Construct } from 'constructs';
import { Stack, StackProps} from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class TechChallengeNetworkStack extends Stack {

    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // Create VPC
        this.vpc = new ec2.Vpc(this, 'MyVpc');
    }
}