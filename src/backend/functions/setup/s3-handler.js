const {
  API_GATEWAY,
  BUILD_BUCKET,
  COGNITO_IDENTITY_POOL,
  FROM_BUCKET,
  MAX_TASKS,
  REGION,
  TO_BUCKET,
  VERSION
} = process.env;

const BACKEND_PATH = `amazon-transcribe-news-media-analysis/v${VERSION}/transcriber.zip`;
const CONFIG_FILENAME = "settings.js";
const FROM_PREFIX = "static/";

module.exports = s3 => {
  const copyFile = params => s3.copyObject(params).promise();
  const listFiles = params => s3.listObjects(params).promise();
  const listVersions = params => s3.listObjectVersions(params).promise();

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
    copyFiles: () => Promise.resolve(),
      // listFiles({ Bucket: FROM_BUCKET, Prefix: FROM_PREFIX }).then(result =>
      //   Promise.all(
      //     result.Contents.map(file =>
      //       copyFile({
      //         ACL: "public-read",
      //         Bucket: TO_BUCKET,
      //         CopySource: `${FROM_BUCKET}/${file.Key}`,
      //         Key: file.Key.slice(FROM_PREFIX.length)
      //       })
      //     )
      //   )
      //),

    removeFiles: () =>
      Promise.all([
        listFiles({ Bucket: TO_BUCKET }),
        listVersions({ Bucket: BUILD_BUCKET })
      ]).then(([uiObjects, buildObjects]) => {
        const toDo = [];

        if (uiObjects.Contents.length > 0)
          toDo.push(deleteFiles(uiObjects.Contents, TO_BUCKET, false));

        if (buildObjects.Versions.length > 0)
          toDo.push(deleteFiles(buildObjects.Versions, BUILD_BUCKET, true));

        return Promise.all(toDo);
      }),

    writeImage: () =>
      copyFile({
        Bucket: BUILD_BUCKET,
        CopySource: `${FROM_BUCKET}/${BACKEND_PATH}`,
        Key: BACKEND_PATH
      }),

    writeSettings: () =>
      s3
        .putObject({
          ACL: "public-read",
          Bucket: TO_BUCKET,
          Key: CONFIG_FILENAME,
          Body: `window.mediaAnalysisSettings = ${JSON.stringify({
            apiGateway: API_GATEWAY,
            cognitoIdentityPool: COGNITO_IDENTITY_POOL,
            maxTasks: parseInt(MAX_TASKS, 10),
            region: REGION
          })};`
        })
        .promise()
  };
};
