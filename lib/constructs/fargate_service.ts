import { Construct } from 'constructs';
import { Token, SecretValue} from 'aws-cdk-lib';
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
            vpc: props.vpc,
        });

        // Instantiate Fargate Service with just cluster and image
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "WebAppFargateService", {
            cluster,
            taskImageOptions: {
                containerName: this.containerName,
                image: new ecs.EcrImage(props.repo, props.imageTag),
                containerPort: 3000,
                secrets: {
                    VTT_DBPASSWORD: ecs.Secret.fromSecretsManager(props.rds.secret!, 'password'),
                    VTT_DBHOST: ecs.Secret.fromSecretsManager(props.rds.secret!, 'host')
                },
            },
        });

        // props.rds.connections.allowFrom(fargateService.service, ec2.Port.tcp(5432));

        this.service = fargateService.service

    }
}
