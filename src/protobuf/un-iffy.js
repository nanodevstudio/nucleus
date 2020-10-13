module.exports = (fileInfo, { jscodeshift }, options) => {
  const ast = jscodeshift(fileInfo.source);

  ast.find(jscodeshift.ExportNamedDeclaration).forEach((path) => {
    if (path.node.declaration) {
      const [decl] = path.node.declaration.declarations;
      const init = decl.init;

      if (init) {
        const fn = init.right.callee;

        if (fn.type === "ArrowFunctionExpression") {
          const items = fn.body.body;
          items.forEach((item) => {
            if (item.type !== "ReturnStatement") {
              path.insertAfter(item);
            }
          });

          path.insertAfter({
            type: "ExportNamedDeclaration",
            declaration: null,
            specifiers: [
              {
                type: "ExportSpecifier",
                local: {
                  type: "Identifier",
                  name: decl.id.name,
                },
                exported: {
                  type: "Identifier",
                  name: decl.id.name,
                },
              },
            ],
            source: null,
          });

          path.replace();
        }
      }
    }
  });

  return ast.toSource();
};

module.exports.parser = "babel";
