import { Logger } from '@nestjs/common';
import { getServers, setServers } from 'node:dns';

const logger = new Logger('DatabaseDNS');
const CLOUDFLARE_PUBLIC_DNS = ['1.1.1.1', '1.0.0.1'];

function parseDnsServers(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
}

export function configureMongoDns(uri: string, configuredServers?: string): void {
  if (!uri.startsWith('mongodb+srv://')) return;

  const explicitServers = parseDnsServers(configuredServers);
  const currentServers = getServers();
  const hasBrokenWarpLoopback =
    process.platform === 'win32' &&
    currentServers.length === 1 &&
    currentServers[0] === '127.0.0.1';

  const servers = explicitServers.length
    ? explicitServers
    : hasBrokenWarpLoopback
      ? CLOUDFLARE_PUBLIC_DNS
      : [];

  if (!servers.length) return;

  try {
    setServers(servers);
    logger.log(
      explicitServers.length
        ? `Using configured DNS resolvers: ${servers.join(', ')}`
        : `Cloudflare WARP loopback detected; using public resolvers: ${servers.join(', ')}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid DNS_SERVERS configuration: ${message}`);
  }
}
