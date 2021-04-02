// const name = 'projects/my-project/secrets/my-secret/versions/5';
const name = 'projects/749504000027/secrets/BOT_TOKEN/versions/latest';

// Imports the Secret Manager library
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Instantiates a client
const client = new SecretManagerServiceClient();

export async function accessSecretVersion(): Promise<string | undefined> {
  const [version] = await client.accessSecretVersion({
    name: name,
  });

  // Extract the payload as a string.
  const payload = version.payload?.data?.toString();
  return payload;
}
