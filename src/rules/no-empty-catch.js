export default {
  meta: {
    type: "problem",
    docs: {
      description: "disallow empty catch blocks",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      PowerShellCatchClause(node) {
        if (node.bodyText.length > 0) {
          return;
        }

        context.report({
          node,
          message: "Catch block is empty; handle the error or document why it is intentionally ignored.",
        });
      },
    };
  },
};
