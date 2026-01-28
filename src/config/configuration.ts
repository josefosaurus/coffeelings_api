export default () => ({
  port: parseInt(process.env.PORT || '5174', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  enableDevAuth: process.env.ENABLE_DEV_AUTH || 'false',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
});
