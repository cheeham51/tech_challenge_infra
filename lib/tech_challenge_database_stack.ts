import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, Duration, Token, SecretValue } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Port, SubnetType } from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { CdkResourceInitializer } from './constructs/resource-initializer';
import * as path from 'path';
import { DockerImageCode } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface TechChallengeDatabaseStackProps extends StackProps {
    vpc: ec2.Vpc,
}

export class TechChallengeDatabaseStack extends Stack {
    
    public readonly rdsDatabase: rds.DatabaseInstance;

    constructor(scope: Construct, id: string, props: TechChallengeDatabaseStackProps) {
        super(scope, id, props);

        // Create RDS database
        this.rdsDatabase = new rds.DatabaseInstance(this, 'RdsDatabase', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_10_17 }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            vpc: props.vpc
        });
          
        // Add custom resource to init database
        const rdsDataSeedingInitializer = new CdkResourceInitializer(this,    'myRdsDataSeedingInitializer', {
            config: {
                credsSecretName: this.rdsDatabase.secret?.secretName
            },
            fnLogRetention: RetentionDays.FIVE_MONTHS,
            fnCode: DockerImageCode.fromImageAsset(path.join(__dirname, '../', 'lambda/rds-init-fn-code'), {}),
            fnTimeout: Duration.minutes(2),
            fnSecurityGroups: [],
            vpc: props.vpc,
            subnetsSelection: props.vpc.selectSubnets({
            subnetType: SubnetType.PRIVATE_WITH_NAT
            })
        })

        // allow the initializer function to connect to the RDS instance
        this.rdsDatabase.connections.allowFromAnyIpv4(Port.tcp(5432));

        // allow initializer function to read RDS instance creds secret
        this.rdsDatabase.secret?.grantRead(rdsDataSeedingInitializer.function)

        // Output RDS data seeding function response
        new CfnOutput(this, 'RdsInitFnResponse', {
            value: Token.asString(rdsDataSeedingInitializer.response)
        })

    }
}