import * as cdk from '@aws-cdk/core';

import * as apigw from "@aws-cdk/aws-apigateway";

export interface ProxyProps {
  readonly apiName: string;
  readonly endpointType: apigw.EndpointType;
}

export class Proxy extends cdk.Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: cdk.Construct, id: string, props: ProxyProps) {
    super(scope, id);

    this.api = new apigw.RestApi(this, "API", {
      restApiName: props.apiName,
      endpointConfiguration: {
        types: [props.endpointType]
      },
    });
  }

  public addProxy(id: string, baseUrl: string, method: string = "GET") {
    const namespace = this.api.root.addResource(id);
    const proxyResource = new apigw.ProxyResource(this, `ProxyResource${method}${id}`, {
      parent: namespace,
      anyMethod: false,
    });

    proxyResource.addMethod(method, new apigw.HttpIntegration(`${baseUrl}/{proxy}`, {
      proxy: true,
      httpMethod: method,
      options: {
        requestParameters: {
          "integration.request.path.proxy": "method.request.path.proxy"
        }
      }
    }), {
      requestParameters: {
        "method.request.path.proxy": true
      }
    });

    new cdk.CfnOutput(this, `EndPoint${method}${id}`, { value: this.api.urlForPath(proxyResource.path) });
  }
}

export class HttpProxyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const proxy = new Proxy(this, "Proxy", {
      apiName: "HttpProxy", endpointType: apigw.EndpointType.EDGE
    });

    proxy.addProxy("aws", "https://aws.amazon.com/ko");
  }
}
