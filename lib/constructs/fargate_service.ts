import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as ecr from 'aws-cdk-lib/aws-ecr';

interface FargateServiceProps {

}

export class FargateService extends Construct {

    public readonly appRepository: ecr.Repository;
    public readonly imageTag: string = 'latest'

    constructor (scope: Construct, id: string, props: FargateServiceProps) {
        super(scope, id);

        // Create VPC and Fargate Cluster
        const vpc = new ec2.Vpc(this, 'MyVpc');
        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

        this.appRepository = new ecr.Repository(this, 'TechChallengeRepository');

        // Instantiate Fargate Service with just cluster and image
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
            cluster,
            taskImageOptions: {
                image: new ecs.EcrImage(this.appRepository, this.imageTag),
            },
        });

    }
}
