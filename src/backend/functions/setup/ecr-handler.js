const { REPOSITORY } = process.env;

module.exports = ecr => ({
  removeImages: () =>
    ecr
      .listImages({ repositoryName: REPOSITORY })
      .promise()
      .then(r =>
        r.imageIds.length > 0
          ? ecr
              .batchDeleteImage({
                repositoryName: REPOSITORY,
                imageIds: r.imageIds
              })
              .promise()
          : Promise.resolve()
      )
});
