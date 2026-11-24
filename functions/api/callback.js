function renderBody(status, content) {
  const safePayload = JSON.stringify(content).replace(/</g, "\u003c");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Shopping_Glue Admin Auth</title>
</head>
<body style="background:#09090B;color:#FAFAFA;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Completing GitHub login...</p>
  <script>
    (function() {
      const status = ${JSON.stringify(status)};
      const content = ${safePayload};
      function receiveMessage(e) {
        window.opener.postMessage(
          "authorization:github:" + status + ":" + JSON.stringify(content),
          e.origin
        );
        window.removeEventListener("message", receiveMessage, false);
        window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return renderBody("error", { message: "Missing OAuth authorization code from GitHub." });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return renderBody("error", {
      message: "Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in Cloudflare Pages."
    });
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Shopping-Glue-Decap-CMS"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    const result = await tokenResponse.json();

    if (result.error || !result.access_token) {
      return renderBody("error", {
        message: result.error_description || result.error || "GitHub authentication failed."
      });
    }

    return renderBody("success", {
      token: result.access_token,
      provider: "github"
    });
  } catch (err) {
    return renderBody("error", { message: err.message || "OAuth proxy error." });
  }
}
