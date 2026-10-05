// Validates req.body against a zod schema and replaces it with the cleaned data.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      errors[key] ??= issue.message;
    }
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
