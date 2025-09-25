import ServerConfigService from '../../lib/serverConfigService';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const configService = new ServerConfigService();
      const config = configService.getAppConfiguration();
      
      res.status(200).json(config);
    } catch (error) {
      console.error('API: Error loading configuration:', error);
      res.status(500).json({ error: 'Failed to load configuration' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
