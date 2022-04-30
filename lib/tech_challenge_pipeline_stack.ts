import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction, CloudFormationCreateUpdateStackAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { BuildEnvironmentVariableType, BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';

export class TechChallengePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
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
    const appBuildOutput = new Artifact('AppBuildOutput')

    techChallengePipeline.addStage({
        stageName: 'Build',
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
          }),
          new CodeBuildAction({
            actionName: 'AppBuild',
            input: appSourceOutput,
            outputs: [appBuildOutput],
            project: new PipelineProject(this, 'AppBuildProject', {
              environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
                privileged: true
              },
              buildSpec: BuildSpec.fromSourceFilename('build_specs/app_build_spec.yml')
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

      techChallengePipeline.addStage({
        stageName: 'Prod',
        actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: 'InfraUpdate',
            stackName: 'TechChallengeInfraStack',
            templatePath: infraBuildOutput.atPath('TechChallengeInfraStack.template.json'),
            adminPermissions: true
          })
        ]
      })

  }
}
