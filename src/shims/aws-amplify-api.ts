import * as Amplify from 'aws-amplify';

// Minimal compatibility shim for older code that used `generateClient` from 'aws-amplify/api'
// This exports a `generateClient` function that returns an object with `graphql` method
// that wraps Amplify's API.graphql calls. In tests or environments where Amplify.API
// isn't configured, it returns safe no-op implementations.

export function generateClient() {
  const graphql = async (options: any) => {
    const API = (Amplify as any).API;
    if (API && typeof API.graphql === 'function') {
      try {
        const res = await API.graphql(options);
        if (res && (res as any).data) return res;
        return { data: (res as any) };
      } catch (err) {
        throw err;
      }
    }

    return { data: {} };
  };

  return {
    graphql,
  };
}

export default generateClient;
