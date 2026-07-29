import { readArg } from './cli';
import { waitForDeploymentIdentity } from './deployment-identity';

await waitForDeploymentIdentity({
  baseUrl: readArg('base'),
  expectedAppSha: readArg('app-sha'),
  attempts: Number.parseInt(readArg('attempts', '30'), 10),
  intervalMs: Number.parseInt(readArg('interval-ms', '2000'), 10),
  consecutiveMatches: Number.parseInt(readArg('consecutive', '3'), 10),
});
