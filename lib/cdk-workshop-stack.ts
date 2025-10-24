import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { WebServerInstance } from "./constructs/web-server-instance";
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
    });

    // EC2
    const webServer1 = new WebServerInstance(this, "WebServer1", {
      vpc,
    });
    const webServer2 = new WebServerInstance(this, "WebServer2", {
      vpc,
    });

    // RDS
    const dbServer1 = new rds.DatabaseInstance(this, "dbServer1", {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_37,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      databaseName: "wordpress",
      multiAz: true
    });

    dbServer1.connections.allowDefaultPortFrom(webServer1.instance);
    dbServer1.connections.allowDefaultPortFrom(webServer2.instance);

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      vpc,
      internetFacing: true,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, "TargetGroup", {
      vpc,
      port: 80,
      healthCheck: {
        path: "/wp-includes/images/blank.gif",
      },
    });

    // targetGroup.addTarget(new elbv2.InstanceTarget(webServer1));
    targetGroup.addTarget(new targets.InstanceTarget(webServer1.instance));
    targetGroup.addTarget(new targets.InstanceTarget(webServer2.instance));

    alb.addListener("Listener", {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // EC2のセキュリティ設定を変更
    webServer1.instance.connections.allowFrom(alb, ec2.Port.tcp(80));
    webServer2.instance.connections.allowFrom(alb, ec2.Port.tcp(80));

    new CfnOutput(this, "ALBDNSName", {
      value: `http://${alb.loadBalancerDnsName}`,
    });
  }
}
