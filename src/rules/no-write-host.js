export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "discourage Write-Host in reusable scripts",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      PowerShellCommand(node) {
        if (node.name.toLowerCase() !== "write-host") {
          return;
        }

        context.report({
          node,
          message:
            "Avoid Write-Host; prefer Write-Output, Write-Verbose, Write-Information, or streams appropriate to the caller.",
        });
      },
    };
  },
};
