const AWS = require("aws-sdk");
const ECRHandler = require("./ecr-handler");
const ResponseHandler = require("./response-handler");
const S3Handler = require("./s3-handler");

exports.handler = (event, context, callback) => {
  const { copyFiles, removeFiles, writeImage, writeSettings } = S3Handler(
    new AWS.S3()
  );
  const { removeRepository } = ECRHandler(new AWS.ECR());
  const { sendResponse } = ResponseHandler(event, context, callback);

  const eventType = event.RequestType;
  let actions;

  if (eventType === "Delete") {
    console.log("Deleting resources");
    actions = [removeFiles(), removeRepository()];
  } else {
    console.log("Creating resources");
    actions = [copyFiles(), writeImage(), writeSettings()];
  }

  Promise.all(actions)
    .then(() => {
      console.log("All actions successfully performed");
      return sendResponse("SUCCESS", {
        Message: `Resources successfully ${eventType.toLowerCase()}d`
      });
    })
    .catch(err => console.log(err) || sendResponse("FAILED"));
};
