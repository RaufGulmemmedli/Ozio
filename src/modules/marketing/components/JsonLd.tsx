/**
 * One `<script type="application/ld+json">` per page.
 *
 * Rendered from a server component, so the payload is in the static HTML that
 * crawlers see. The JSON is produced by `lib/seo.ts` with `JSON.stringify`, so it
 * is already escaped; `</script>` cannot appear in it because the builders never
 * put raw markup in a value, and the `<` guard below makes that explicit.
 */

export interface JsonLdProps {
  /** Output of `jsonLdGraph()`. */
  json: string;
}

export function JsonLd({ json }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // The schema.org payload must be a raw JSON text node; `<` is escaped above.
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  );
}
