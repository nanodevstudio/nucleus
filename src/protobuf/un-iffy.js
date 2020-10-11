module.exports = (fileInfo, api, options) => {
  const ast = api.jscodeshift(fileInfo.source);

  const result = ast.find(jscodeshift.ExportNamedDeclaration);

  console.log(result);
};

module.exports.parser = "flow";
