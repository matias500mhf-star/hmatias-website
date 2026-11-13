import catalog from "../../../../../../source-ao/data/catalog.json";

export const prerender = true;

export const GET = () => new Response(JSON.stringify(catalog), {
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=3600"
  }
});
