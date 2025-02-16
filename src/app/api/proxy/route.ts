export async function GET(req: Request) {
    const url = `https://my-deployment-5421f6.kb.us-west1.gcp.cloud.es.io/app/dashboards#/view/8d6d76ec-55eb-4d07-b566-c9e49b60361c`;

    const response = await fetch(url, {
        headers: { host: "my-deployment-5421f6.kb.us-west1.gcp.cloud.es.io" },
    });

    let html = await response.text();

    // Remove CSP meta tags
    html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/gi, "");

    return new Response(html, {
        status: response.status,
        headers: {
            "Content-Type": "text/html",
            "X-Frame-Options": "ALLOWALL",
            "Content-Security-Policy": "frame-ancestors 'self'",
        },
    });
}
