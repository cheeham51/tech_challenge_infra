import { SecretValue, Stack, StackProps, CfnOutput, Duration, Token} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction, CloudFormationCreateUpdateStackAction, GitHubSourceAction, EcsDeployAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import {PolicyStatement} from 'aws-cdk-lib/aws-iam'
import { FargateService } from './constructs/fargate_service'
import { Port, Vpc } from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

interface TechChallengePipelineStackProps extends StackProps {
  vpc: Vpc,
  rds: rds.DatabaseInstance,
}

export class TechChallengePipelineStack extends Stack {
  
  private readonly ImageTag: string = 'latest'

  constructor(scope: Construct, id: string, props: TechChallengePipelineStackProps) {
    super(scope, id, props);

    const techChallengePipeline = new Pipeline(this, 'TechChallengePipeline', {
        crossAccountKeys: false,
        pipelineName: 'TechChallengePipeline',
        restartExecutionOnUpdate: true
    })

    const infraSourceOutput = new Artifact('InfraSourceOutput')
    const appSourceOutput = new Artifact('AppSourceOutput')

    techChallengePipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: 'cheeham51',
          repo: 'tech_challenge_infra',
          branch: 'main',
          actionName: 'InfraPipelineSource',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: infraSourceOutput
        }),
        new GitHubSourceAction({
          owner: 'cheeham51',
          repo: 'TechChallengeApp',
          branch: 'master',
          actionName: 'AppSource',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: appSourceOutput
        })
      ]
    })

    const infraBuildOutput = new Artifact('InfraBuildOutput')

    techChallengePipeline.addStage({
        stageName: 'CdkBuild',
        actions: [
          new CodeBuildAction({
            actionName: 'CdkBuild',
            input: infraSourceOutput,
            outputs: [infraBuildOutput],
            project: new PipelineProject(this, 'InfraBuildProject', {
              environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0
              },
              buildSpec: BuildSpec.fromSourceFilename('build_specs/pipeline_build_spec.yml')
            })
          })
        ]
      })

      techChallengePipeline.addStage({
        stageName: 'PipelineUpdate',
        actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: 'PipelineUpdate',
            stackName: 'TechChallengePipelineStack',
            templatePath: infraBuildOutput.atPath('TechChallengePipelineStack.template.json'),
            adminPermissions: true
          })
        ]
      })

      const appBuildOutput = new Artifact('AppBuildOutput')

      const appRepository = new ecr.Repository(this, 'TechChallengeRepository');

      const appBuildProject = new PipelineProject(this, 'AppBuildProject', {
        environment: {
          buildImage: LinuxBuildImage.STANDARD_5_0,
          privileged: true
        },
        buildSpec: BuildSpec.fromSourceFilename('build_specs/app_build_spec.yml'),
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: {value: this.account},
          IMAGE_REPO_NAME: {value: appRepository.repositoryName},
          IMAGE_TAG: {value: 'latest'},
          REPOSITORY_URI: {value: appRepository.repositoryUri}
        }
      })

      appBuildProject.addToRolePolicy(
        new PolicyStatement({
          actions: ['*'],
          resources: ['*'],
        })
      )

      techChallengePipeline.addStage({
        stageName: 'AppBuild',
        actions: [
          new CodeBuildAction({
            actionName: 'AppBuild',
            input: appSourceOutput,
            outputs: [appBuildOutput],
            project: appBuildProject,
            runOrder: 2,
          }),
        ]
      })

      // Create Fargate service
      const fargateService = new FargateService(this, 'TechChallengeFargateService', {
        repo: appRepository,
        imageTag: this.ImageTag,
        vpc: props.vpc,
        rds: props.rds,
      })

      // Add security group rule to allow access from Fargate Service to RDS on port 5432
      props.rds.connections.allowFrom(fargateService.service, Port.tcp(5432));

      techChallengePipeline.addStage({
        stageName: 'Prod',
        actions: [
          new EcsDeployAction({
            actionName: 'AppDeploy',
            service: fargateService.service,
            input: appBuildOutput
          })
        ]
      })

  }
}
