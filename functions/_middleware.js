export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'dumptree.pages.dev') {
    url.hostname = 'dumptree.yv3.uk';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
