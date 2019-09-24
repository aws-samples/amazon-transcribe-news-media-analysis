const { REPOSITORY } = process.env;

module.exports = ecr => {
  const listImages = () =>
    ecr.listImages({ repositoryName: REPOSITORY }).promise();

  return {
    getImageCount: () => listImages().then(r => r.imageIds.length),

    removeImages: () =>
      listImages().then(r =>
        r.imageIds.length > 0
          ? ecr
              .batchDeleteImage({
                repositoryName: REPOSITORY,
                imageIds: r.imageIds
              })
              .promise()
          : Promise.resolve()
      )
  };
};
