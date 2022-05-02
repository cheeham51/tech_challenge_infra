import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, Duration, Token } from 'aws-cdk-lib';
import rds = require('aws-cdk-lib/aws-rds');
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface TechChallengeDatabaseStackProps extends StackProps {
    vpc: ec2.Vpc
}

export class TechChallengeDatabaseStack extends Stack {
    constructor(scope: Construct, id: string, props: TechChallengeDatabaseStackProps) {
        super(scope, id, props);

        // Create RDS database
        const rdsDatabase = new rds.DatabaseInstance(this, 'RdsDatabase', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_10_17 }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            vpc: props.vpc
        });

    }
}