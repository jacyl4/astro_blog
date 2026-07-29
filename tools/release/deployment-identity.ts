export interface HtmlDeploymentIdentity {
  appSha: string;
  runtimeAsset: string;
}

export function readHtmlDeploymentIdentity(html: string): HtmlDeploymentIdentity {
  const appSha = html.match(
    /<meta\s+name="build-app-sha"\s+content="([0-9a-f]{40}|local)"\s*\/?>/,
  )?.[1];
  const runtimeAsset = html.match(/\bsrc="(\/_assets\/[^"]+\.js)"/)?.[1];

  if (!appSha) throw new Error('root HTML has no build-app-sha identity');
  if (!runtimeAsset) throw new Error('root HTML has no runtime asset');
  return { appSha, runtimeAsset };
}

interface WaitOptions {
  baseUrl: string;
  expectedAppSha: string;
  attempts?: number;
  intervalMs?: number;
  consecutiveMatches?: number;
}

export async function waitForDeploymentIdentity({
  baseUrl,
  expectedAppSha,
  attempts = 30,
  intervalMs = 2_000,
  consecutiveMatches = 3,
}: WaitOptions): Promise<void> {
  let consecutive = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const nonce = `${Date.now()}-${attempt}`;
    const rootUrl = new URL('/', baseUrl);
    const manifestUrl = new URL('/_meta/build-manifest.json', baseUrl);
    rootUrl.searchParams.set('deployment_probe', nonce);
    manifestUrl.searchParams.set('deployment_probe', nonce);

    try {
      const headers = { 'cache-control': 'no-cache' };
      const [rootResponse, manifestResponse] = await Promise.all([
        fetch(rootUrl, { headers }),
        fetch(manifestUrl, { headers }),
      ]);
      if (!rootResponse.ok || !manifestResponse.ok) {
        throw new Error(
          `identity endpoints returned ${rootResponse.status}/${manifestResponse.status}`,
        );
      }

      const identity = readHtmlDeploymentIdentity(await rootResponse.text());
      const manifest = await manifestResponse.json() as { appSha?: string };
      const assetResponse = await fetch(new URL(identity.runtimeAsset, baseUrl), {
        method: 'HEAD',
        headers,
      });
      const matches = identity.appSha === expectedAppSha
        && manifest.appSha === expectedAppSha
        && assetResponse.ok;
      consecutive = matches ? consecutive + 1 : 0;
      console.log(JSON.stringify({
        attempt,
        expectedAppSha,
        htmlAppSha: identity.appSha,
        manifestAppSha: manifest.appSha,
        runtimeAsset: identity.runtimeAsset,
        runtimeAssetStatus: assetResponse.status,
        consecutive,
      }));
      if (consecutive >= consecutiveMatches) return;
    } catch (error) {
      consecutive = 0;
      console.error(JSON.stringify({
        attempt,
        expectedAppSha,
        error: error instanceof Error ? error.message : String(error),
      }));
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(
    `deployment identity did not converge to ${expectedAppSha} after ${attempts} attempts`,
  );
}
