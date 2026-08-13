const commitlintConfig = {
  rules: {
    "header-max-length": [2, "always", 100],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "slicing",
        "docs",
        "chore",
        "refactor",
        "test",
        "ci",
        "perf",
        "style",
        "build",
        "revert",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
  },
};

export default commitlintConfig;
