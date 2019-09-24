const AWS = require("aws-sdk");
const ECRHandler = require("./ecr-handler");
const ResponseHandler = require("./response-handler");
const S3Handler = require("./s3-handler");

const delay = (t, v) =>
  new Promise(resolve => {
    console.log(`Waiting ${t}s for the image to be ready...`)
    setTimeout(resolve.bind(null, v), t);
  });

exports.handler = (event, context, callback) => {
  const { copyFiles, removeFiles, writeImage, writeSettings } = S3Handler(
    new AWS.S3()
  );
  const { getImageCount, removeImages } = ECRHandler(new AWS.ECR());
  const { sendResponse } = ResponseHandler(event, context, callback);

  const eventType = event.RequestType;
  let actions;

  const ensureImageIsReady = () =>
    getImageCount().then(c =>
      c > 0 ? Promise.resolve() : delay(5000).then(ensureImageIsReady)
    );

  if (eventType === "Delete") {
    console.log("Deleting resources");
    actions = [removeFiles(), removeImages()];
  } else {
    console.log("Creating resources");
    actions = [
      writeImage(),
      copyFiles(),
      writeSettings(),
      ensureImageIsReady()
    ];
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
