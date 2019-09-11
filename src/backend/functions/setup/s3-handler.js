const mime = require('mime-types');
const unzip = require('unzipper');

const {
  API_GATEWAY,
  BUILD_BUCKET,
  COGNITO_IDENTITY_POOL,
  FROM_BUCKET,
  MAX_TASKS,
  REGION,
  WEBUI_BUCKET,
  VERSION
} = process.env;

const TRANSCRIBER_FILE = 'transcriber.zip';
const SOLUTION_KEY = `amazon-transcribe-news-media-analysis/v${VERSION}`;
const BACKEND_PATH = `${SOLUTION_KEY}/${TRANSCRIBER_FILE}`;
const FRONTEND_PATH = `${SOLUTION_KEY}/frontend.zip`;
const BUILD_PATH = `build/${TRANSCRIBER_FILE}`;
const CONFIG_FILENAME = "settings.js";

module.exports = s3 => {
  const copyFile = params => s3.copyObject(params).promise();
  const listFiles = params => s3.listObjects(params).promise();
  const listVersions = params => s3.listObjectVersions(params).promise();
  const putObject = params => s3.putObject(params).promise();
  const upload = params => s3.upload(params).promise();

  const deleteFiles = (objects, bucket, withVersioning) => {
    const mapper = withVersioning
      ? ({ Key, VersionId }) => ({ Key, VersionId })
      : ({ Key }) => ({ Key });

    return s3
      .deleteObjects({
        Bucket: bucket,
        Delete: { Objects: objects.map(mapper), Quiet: false }
      })
      .promise();
  };

  return {
    copyFiles: () =>
        unzip.Open.s3(s3, {Bucket: FROM_BUCKET, Key: FRONTEND_PATH})
            .then(directory => directory.files.filter(x => x.type !== 'Directory'))
            .then(files =>  files.map(
                file => upload({
                    ACL: 'public-read',
                    Body: file.stream(),
                    Bucket: WEBUI_BUCKET,
                    ContentType: mime.lookup(file.path) || 'application/octet-stream',
                    Key: file.path}))
            )
            .then(ps => Promise.all(ps))
            .then(() => console.log('Directory unzipped to S3')),

    removeFiles: () =>
      Promise.all([
        listFiles({ Bucket: WEBUI_BUCKET }),
        listVersions({ Bucket: BUILD_BUCKET })
      ]).then(([uiObjects, buildObjects]) => {
        const toDo = [];

        if (uiObjects.Contents.length > 0)
          toDo.push(deleteFiles(uiObjects.Contents, WEBUI_BUCKET, false));

        if (buildObjects.Versions.length > 0)
          toDo.push(deleteFiles(buildObjects.Versions, BUILD_BUCKET, true));

        return Promise.all(toDo);
      }),

    writeImage: () =>
      copyFile({
        Bucket: BUILD_BUCKET,
        CopySource: `${FROM_BUCKET}/${BACKEND_PATH}`,
        Key: BUILD_PATH
      }),

    writeSettings: () =>
       putObject({
         ACL: "public-read",
         Bucket: WEBUI_BUCKET,
         Key: CONFIG_FILENAME,
         Body: `window.mediaAnalysisSettings = ${JSON.stringify({
           apiGateway: API_GATEWAY,
           cognitoIdentityPool: COGNITO_IDENTITY_POOL,
           maxTasks: parseInt(MAX_TASKS, 10),
           region: REGION
         })};`
       })
  };
};
