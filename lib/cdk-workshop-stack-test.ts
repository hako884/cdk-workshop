import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

// ファイルを読み込むためのパッケージを import
import { readFileSync } from "fs";

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    }) 

    const webServer1 = new ec2.Instance(this, 'WordPressServer1', {
      vpc,
      instanceType: ec2.InstanceType.of(
        
      )
    })

  }
}
