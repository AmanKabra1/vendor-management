export const jwtConstants = {
  // In production, load this from an environment variable.
  secret: process.env.JWT_SECRET || 'vendor-management-dev-secret-change-me',
  expiresIn: '1d',
};
