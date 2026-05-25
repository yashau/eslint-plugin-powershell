import { approvedVerbs } from "./shared/approved-verbs.js";

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "require functions to use approved PowerShell verbs",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      PowerShellFunction(node) {
        const [verb] = node.name.split("-");
        if (!verb || approvedVerbs.has(verb)) {
          return;
        }

        context.report({
          node,
          message: `Function '${node.name}' uses unapproved verb '${verb}'.`,
        });
      },
    };
  },
};
