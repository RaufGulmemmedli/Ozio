/**
 * Required fallback for the `@modal` parallel route: on a direct hit (or any URL
 * that does not match an intercepted route) the slot renders nothing and the
 * page below is shown on its own.
 */
export default function ModalDefault() {
  return null;
}
