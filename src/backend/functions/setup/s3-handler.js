const {
  API_GATEWAY,
  BUILD_BUCKET,
  COGNITO_IDENTITY_POOL,
  FROM_BUCKET,
  MAX_TASKS,
  REGION,
  TO_BUCKET
} = process.env;

const BACKEND_PATH = "docker/backend.zip";
const CONFIG_FILENAME = "settings.js";
const FROM_PREFIX = "static/";

module.exports = s3 => {
  const copyFile = params => s3.copyObject(params).promise();
  const deleteFiles = params => s3.deleteObjects(params).promise();
  const listFiles = params => s3.listObjects(params).promise();

  const mapListToBulkDelete = (result, bucket) => ({
    Bucket: bucket,
    Delete: {
      Objects: result.Contents.map(({ Key }) => ({ Key })),
      Quiet: false
    }
  });

  return {
    copyFiles: () =>
      listFiles({
        Bucket: FROM_BUCKET,
        Prefix: FROM_PREFIX
      }).then(result =>
        Promise.all(
          result.Contents.map(file =>
            copyFile({
              ACL: "public-read",
              Bucket: TO_BUCKET,
              CopySource: `${FROM_BUCKET}/${file.Key}`,
              Key: file.Key.slice(FROM_PREFIX.length)
            })
          )
        )
      ),

    removeFiles: () =>
      listFiles({ Bucket: TO_BUCKET }).then(result =>
        deleteFiles(mapListToBulkDelete(result, TO_BUCKET)).then(() =>
          listFiles({ Bucket: BUILD_BUCKET }).then(result =>
            deleteFiles(mapListToBulkDelete(result, BUILD_BUCKET))
          )
        )
      ),

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
