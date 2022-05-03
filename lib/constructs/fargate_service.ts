import { Construct } from 'constructs';
import { Token } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as ecr from 'aws-cdk-lib/aws-ecr';
import {DatabaseInstance} from 'aws-cdk-lib/aws-rds'


interface FargateServiceProps {
    repo: ecr.Repository,
    imageTag: string,
    vpc: ec2.Vpc,
    rds: DatabaseInstance,
}

export class FargateService extends Construct {

    public readonly appRepository: ecr.Repository;
    public readonly imageTag: string = 'latest'
    public readonly service: ecs.FargateService
    public readonly containerName: string = 'servian'

    constructor (scope: Construct, id: string, props: FargateServiceProps) {
        super(scope, id);

        // Create VPC and Fargate Cluster
        // const vpc = new ec2.Vpc(this, 'MyVpc');
        const cluster = new ecs.Cluster(this, 'Cluster', {
            vpc: props.vpc
        });

        // Instantiate Fargate Service with just cluster and image
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "WebAppFargateService", {
            cluster,
            taskImageOptions: {
                containerName: this.containerName,
                image: new ecs.EcrImage(props.repo, props.imageTag),
                containerPort: 3000,
                environment: {
                    // VTT_DBPASSWORD: props.password, // Pass RDS password from secret manager as an environment variable to Fargate without hardcoding the credentials
                    // VTT_DBHOST: props.host, // Pass RDS host address from secret manager as an environment variable to Fargate without hardcoding the host address
                  },
            },
        });

        this.service = fargateService.service

    }
}
