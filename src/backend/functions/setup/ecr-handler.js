const { REPOSITORY } = process.env;

module.exports = ecr => ({
  removeRepository: () =>
    ecr.deleteRepository({ force: true, repositoryName: REPOSITORY }).promise()
});
