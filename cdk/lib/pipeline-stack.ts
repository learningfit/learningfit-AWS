import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';

export class PipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ECRリポジトリの参照
        const repository = ecr.Repository.fromRepositoryName(this, 'EcrRepo', 'lfit-app');

        // CodeBuildプロジェクト作成
        const buildProject = new codebuild.PipelineProject(this, 'MyBuildProject', {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                privileged: true, // Dockerを使用するために必要
            },
            environmentVariables: {
                REPOSITORY_URI: { value: repository.repositoryUri },
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    pre_build: {
                        commands: [
                            'echo Logging in to Amazon ECR...',
                            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI',
                        ],
                    },
                    build: {
                        commands: [
                            'echo Building the Docker image...',
                            'docker build -t $REPOSITORY_URI:latest .',
                            'docker push $REPOSITORY_URI:latest',
                        ],
                    },
                    post_build: {
                        commands: [
                            'echo Updating ECS service...',
                            'aws ecs update-service --cluster LfitCluster --service LfitService --force-new-deployment',
                        ],
                    },
                },
            }),
        });
        buildProject.addToRolePolicy(new iam.PolicyStatement({
            actions: ['ecr:*', 'ecs:*'],
            resources: ['*'],
        }));

        // CodePipeline作成
        const pipeline = new codepipeline.Pipeline(this, 'MyPipeline');
        // ソースステージ
        const sourceOutput = new codepipeline.Artifact();
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                new codepipelineActions.GitHubSourceAction({
                    actionName: 'GitHub_Source',
                    owner: 'inoccu',
                    repo: 'lfit_aws_app',
                    branch: 'main',
                    oauthToken: cdk.SecretValue.secretsManager('github-token'),
                    output: sourceOutput,
                    trigger: codepipelineActions.GitHubTrigger.WEBHOOK,
                }),
            ],
        });    // ビルドステージ
        pipeline.addStage({
            stageName: 'Build',
            actions: [
                new codepipelineActions.CodeBuildAction({
                    actionName: 'Build_and_Push',
                    project: buildProject,
                    input: sourceOutput,
                }),
            ],
        });
    }
}
