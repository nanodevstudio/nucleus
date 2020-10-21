function isOneOfField(node) {
  if (
    node.type === "VariableDeclaration" &&
    node.declarations[0].id.name === "$oneOfFields"
  ) {
    console.log("ran");
    return true;
  }

  return false;
}

module.exports = (fileInfo, { jscodeshift }, options) => {
  const ast = jscodeshift(fileInfo.source);
  let firstOneOf = false;

  ast.find(jscodeshift.ExportNamedDeclaration).forEach((path) => {
    if (path.node.declaration) {
      const [decl] = path.node.declaration.declarations;
      const init = decl.init;

      if (init) {
        const fn = init.right.callee;

        if (fn.type === "ArrowFunctionExpression") {
          path.insertAfter(
            jscodeshift.expressionStatement(
              jscodeshift.assignmentExpression(
                "=",
                jscodeshift.memberExpression(
                  jscodeshift.identifier("$root"),
                  jscodeshift.identifier(decl.id.name)
                ),
                jscodeshift.identifier(decl.id.name)
              )
            )
          );
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

          const items = fn.body.body;

          items
            .slice()
            .reverse()
            .forEach((item) => {
              if (isOneOfField(item)) {
                if (!firstOneOf) {
                  firstOneOf = true;
                  path.insertAfter(item);
                  return;
                } else {
                  return;
                }
              }

              if (item.type !== "ReturnStatement") {
                path.insertAfter(item);
              }
            });

          path.replace();
        }
      }
    }
  });

  return ast.toSource();
};

module.exports.parser = "babel";
