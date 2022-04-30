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
        })
      ]
    })

    const infraBuildOutput = new Artifact('InfraBuildOutput')

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
          })
        ]
      })

      techChallengePipeline.addStage({
        stageName: 'PipelineUpdate',
        actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: 'TechChallengePipelineUpdate',
            stackName: 'TechChallengePipelineStack',
            templatePath: infraBuildOutput.atPath('TechChallengePipelineStack.template.json'),
            adminPermissions: true
          })
        ]
      })

  }
}
