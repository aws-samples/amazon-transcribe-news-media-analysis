import Amplify, { API } from "aws-amplify";

const region = window.mediaAnalysisSettings.region || "eu-west-1";

Amplify.configure({
  Auth: {
    identityPoolId: window.mediaAnalysisSettings.cognitoIdentityPool,
    region
  },
  API: {
    endpoints: [
      {
        name: "apiGateway",
        endpoint: window.mediaAnalysisSettings.apiGateway,
        region
      }
    ]
  }
});

export default (url, method, data) =>
  API[method || "get"]("apiGateway", url, {
    body: data || undefined,
    headers: { "Content-Type": "application/json" }
  });
