import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import ec2 = require('aws-cdk-lib/aws-ec2');
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Repository } from 'aws-cdk-lib/aws-ecr';

interface TechChallengeInfraStackProps extends StackProps {
  ImageTag: string,
  Repo: Repository
}

export class TechChallengeInfraStack extends Stack {
  // public readonly fargateService: ecs_patterns.ApplicationLoadBalancedFargateService
  constructor(scope: Construct, id: string, props: TechChallengeInfraStackProps) {
    super(scope, id, props);

    // Create VPC and Fargate Cluster
    // const vpc = new ec2.Vpc(this, 'TechChallengeVpc')
    // const cluster = new ecs.Cluster(this, 'Cluster', { vpc })

    // Create

    // Instantiate Fargate Service with just cluster and image
    // this.fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
    //   cluster,
    //   taskImageOptions: {
    //     image: new ecs.EcrImage(props.Repo, props.ImageTag)
    //   },
    // });

  }
}
