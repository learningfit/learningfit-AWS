import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC作成
    const vpc = new ec2.Vpc(this, 'LfitVpc', {
      maxAzs: 2,
      natGateways: 0,
    });

    // ECSクラスター作成
    const cluster = new ecs.Cluster(this, 'LfitCluster', {
      vpc,
      clusterName: 'LfitCluster',
    });

    // EC2インスタンスの追加
    cluster.addCapacity('LfitASG', {
      instanceType: new ec2.InstanceType('t2.micro'),
      desiredCapacity: 1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      }
    });

    // ECRリポジトリ作成
    const repo = new ecr.Repository(this, 'LfitEcrRepo', {
      repositoryName: 'lfit-app',
    });

    // ECSタスク定義とサービス作成
    const taskDef = new ecs.Ec2TaskDefinition(this, 'LfitTaskDef');
    const container = taskDef.addContainer('LfitContainer', {
      //image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      image: ecs.ContainerImage.fromEcrRepository(repo),
      memoryLimitMiB: 256,
    });
    container.addPortMappings({ containerPort: 80 });
    const service = new ecs.Ec2Service(this, 'LfitService', {
      cluster,
      taskDefinition: taskDef,
      serviceName: 'LfitService',
    });

    // ALB作成
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LfitLB', {
      vpc,
      internetFacing: true,
    });
    const listener = lb.addListener('HttpListener', {
      port: 80,
    });
    listener.addTargets('ECS', {
      port: 80,
      targets: [service],
    });
    new cdk.CfnOutput(this, 'LfitLBDNS', {
      value: lb.loadBalancerDnsName,
    });
  }
}
